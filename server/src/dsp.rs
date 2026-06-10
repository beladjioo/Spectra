//! DSP core for RF Academy.
//!
//! Shared by the live HackRF path and the built-in simulator: both end up with a
//! dB power spectrum which `extract` turns into a `Frame` (noise floor, peaks,
//! occupancy, drone flag, downsampled trace) for the UI. This is the drone-agent
//! analysis generalised into a tunable, mode-agnostic spectrum analyser.

use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use num_complex::Complex;
use rustfft::{Fft, FftPlanner};
use serde::Serialize;

pub const N: usize = 4096; // FFT size
pub const OUT_BINS: usize = 256; // spectrum points sent to the UI
const SNR_DB: f32 = 8.0; // a bin is "occupied" above noise + SNR_DB
const WIDEBAND_MHZ: f32 = 5.0; // a band this wide ≈ an OFDM video link (drone)

const FM_IF_RATE: f64 = 240e3; // intermediate rate the IQ is decimated to before demod
const FM_AUDIO_TARGET: f64 = 48e3; // target audio rate (actual rate depends on fs)
const FM_DEVIATION_HZ: f32 = 75e3; // broadcast FM deviation, used to normalise audio
const DEEMPHASIS_S: f32 = 50e-6; // European FM de-emphasis time constant

/// Which SDR is currently feeding the app (or none → simulator).
#[derive(Clone, Default, Serialize)]
pub struct SdrInfo {
    pub present: bool,
    pub driver: String, // e.g. "hackrf" (or "sim")
    pub label: String, // e.g. "HackRF One #0 c66c…"
    pub serial: String, // device serial number
}

#[derive(Clone, Serialize)]
pub struct Peak {
    pub center_mhz: f32,
    pub bandwidth_mhz: f32,
    pub power_db: f32,
    pub snr_db: f32,
    pub wideband: bool,
}

/// One analysed spectrum snapshot streamed to the browser.
#[derive(Clone, Serialize)]
pub struct Frame {
    pub center_mhz: f32,
    pub span_mhz: f32,
    pub sample_rate_msps: f32,
    pub gain_db: f32,
    pub noise_floor_db: f32,
    pub peak_db: f32,
    pub occupancy: f32, // fraction of bins above threshold (0..1)
    pub peaks: Vec<Peak>,
    pub drone_suspected: bool,
    pub bins: Vec<f32>, // OUT_BINS dB points
    pub sim: bool, // true when no real SDR is connected (simulator running)
    pub sdr: SdrInfo,
    pub audio_rate: f32, // actual PCM rate of the /audio stream at this fs
    pub aircraft: Vec<crate::adsb::Aircraft>, // ADS-B tracks (1090 MHz only)
    pub ts: f64,
}

fn now_ts() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs_f64()
}

/// Averages FFT power frames from live IQ, then renders a dB spectrum.
/// A Hann window is applied before each FFT to keep strong carriers from
/// leaking across the whole span (we *teach* spectrum reading — leakage lies).
pub struct Analyzer {
    fft: Arc<dyn Fft<f32>>,
    acc: Vec<f32>,
    scratch: Vec<Complex<f32>>,
    window: Vec<f32>,
    frames: usize,
}

impl Analyzer {
    pub fn new() -> Self {
        let mut planner = FftPlanner::<f32>::new();
        let window: Vec<f32> = (0..N)
            .map(|i| {
                let x = std::f32::consts::TAU * i as f32 / (N - 1) as f32;
                0.5 * (1.0 - x.cos())
            })
            .collect();
        Self {
            fft: planner.plan_fft_forward(N),
            acc: vec![0.0; N],
            scratch: vec![Complex::new(0.0, 0.0); N],
            window,
            frames: 0,
        }
    }

    pub fn accumulate(&mut self, buf: &[Complex<f32>]) {
        if buf.len() < N {
            return;
        }
        for ((s, &b), &w) in self.scratch.iter_mut().zip(&buf[..N]).zip(&self.window) {
            *s = b * w;
        }
        self.fft.process(&mut self.scratch);
        for (a, c) in self.acc.iter_mut().zip(self.scratch.iter()) {
            *a += c.norm_sqr();
        }
        self.frames += 1;
    }

    /// fftshifted dB spectrum; resets the accumulator for the next window.
    pub fn render_db(&mut self) -> Vec<f32> {
        let f = self.frames.max(1) as f32;
        let mut db = vec![0f32; N];
        for i in 0..N {
            let src = (i + N / 2) % N; // DC to centre
            let p = self.acc[src] / f / N as f32;
            db[i] = 10.0 * (p + 1e-12).log10();
        }
        self.acc.iter_mut().for_each(|x| *x = 0.0);
        self.frames = 0;
        db
    }
}

/// Turn a dB spectrum into a `Frame`: noise floor (20th pct), peaks/bursts,
/// occupancy, and a downsampled trace.
pub fn extract(db: &[f32], center_hz: f64, fs: f64, gain_db: f64, sdr: &SdrInfo) -> Frame {
    let n = db.len();
    let bin_hz = fs / n as f64;

    let mut sorted = db.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let noise = sorted[n / 5];
    let peak_db = *sorted.last().unwrap();
    let thr = noise + SNR_DB;

    let mut peaks = Vec::new();
    let mut occupied = 0usize;
    let mut i = 0usize;
    while i < n {
        if db[i] > thr {
            let start = i;
            let mut pk = db[i];
            while i < n && db[i] > thr {
                pk = pk.max(db[i]);
                occupied += 1;
                i += 1;
            }
            let w = i - start;
            let bw = (w as f64 * bin_hz / 1e6) as f32;
            let mid = start + w / 2;
            let off = (mid as f64 - n as f64 / 2.0) * bin_hz;
            peaks.push(Peak {
                center_mhz: ((center_hz + off) / 1e6) as f32,
                bandwidth_mhz: bw,
                power_db: pk,
                snr_db: pk - noise,
                wideband: bw >= WIDEBAND_MHZ,
            });
        } else {
            i += 1;
        }
    }
    peaks.sort_by(|a, b| b.snr_db.partial_cmp(&a.snr_db).unwrap());
    peaks.truncate(12);
    let drone_suspected = peaks.iter().any(|p| p.wideband);

    // Max-decimate the trace: taking every step-th bin would make a narrow burst
    // (LoRa!) detectable by `peaks` yet invisible on screen.
    let step = (n / OUT_BINS).max(1);
    let bins: Vec<f32> = (0..OUT_BINS)
        .map(|k| {
            let a = (k * step).min(n - 1);
            let b = ((k + 1) * step).min(n);
            db[a..b.max(a + 1)].iter().cloned().fold(f32::MIN, f32::max)
        })
        .collect();

    Frame {
        center_mhz: (center_hz / 1e6) as f32,
        span_mhz: (fs / 1e6) as f32,
        sample_rate_msps: (fs / 1e6) as f32,
        gain_db: gain_db as f32,
        noise_floor_db: noise,
        peak_db,
        occupancy: occupied as f32 / n as f32,
        peaks,
        drone_suspected,
        bins,
        sim: !sdr.present,
        sdr: sdr.clone(),
        audio_rate: audio_rate_for(fs) as f32,
        aircraft: Vec::new(),
        ts: now_ts(),
    }
}

/// Decimation factors and resulting audio rate for a given SDR sample rate.
/// Stage 1 brings the IQ near 240 kHz (wide enough for the ±75 kHz FM signal),
/// stage 2 brings the demodulated audio near 48 kHz. Integer factors only, so
/// the *actual* rate differs slightly from 48 kHz — it is reported in `Frame`
/// and the browser builds its audio buffers at that exact rate (no drift).
fn fm_plan(fs: f64) -> (usize, usize) {
    let d1 = (fs / FM_IF_RATE).round().max(1.0) as usize;
    let if_rate = fs / d1 as f64;
    let d2 = (if_rate / FM_AUDIO_TARGET).round().max(1.0) as usize;
    (d1, d2)
}

pub fn audio_rate_for(fs: f64) -> f64 {
    let (d1, d2) = fm_plan(fs);
    fs / (d1 * d2) as f64
}

/// Broadcast-FM demodulator with state carried across IQ blocks.
///
/// Pipeline: boxcar-decimate the IQ to ~240 kHz → phase-discriminate
/// (arg of s·conj(prev), normalised so ±75 kHz deviation ≈ ±1) → 50 µs
/// de-emphasis (single-pole IIR) → boxcar-decimate to ~48 kHz mono PCM.
pub struct FmDemod {
    d1: usize,
    d2: usize,
    iq_acc: Complex<f32>,
    iq_cnt: usize,
    last: Complex<f32>,
    deemph_a: f32,
    deemph_y: f32,
    au_acc: f32,
    au_cnt: usize,
}

impl FmDemod {
    pub fn new(fs: f64) -> Self {
        let (d1, d2) = fm_plan(fs);
        let if_rate = fs / d1 as f64;
        let dt = 1.0 / if_rate as f32;
        Self {
            d1,
            d2,
            iq_acc: Complex::new(0.0, 0.0),
            iq_cnt: 0,
            last: Complex::new(0.0, 0.0),
            deemph_a: 1.0 - (-dt / DEEMPHASIS_S).exp(),
            deemph_y: 0.0,
            au_acc: 0.0,
            au_cnt: 0,
        }
    }

    pub fn process(&mut self, iq: &[Complex<f32>], fs: f64) -> Vec<f32> {
        let if_rate = fs / self.d1 as f64;
        // phase step → audio: Δφ = 2π·f/if_rate, full scale at f = ±FM_DEVIATION_HZ
        let gain = if_rate as f32 / (std::f32::consts::TAU * FM_DEVIATION_HZ);
        let mut out = Vec::with_capacity(iq.len() / (self.d1 * self.d2) + 1);
        for &s in iq {
            self.iq_acc += s;
            self.iq_cnt += 1;
            if self.iq_cnt < self.d1 {
                continue;
            }
            let z = self.iq_acc / self.d1 as f32; // stage-1 boxcar LPF + decimate
            self.iq_acc = Complex::new(0.0, 0.0);
            self.iq_cnt = 0;

            let p = z * self.last.conj(); // instantaneous frequency
            self.last = z;
            let demod = p.im.atan2(p.re) * gain;
            self.deemph_y += self.deemph_a * (demod - self.deemph_y); // de-emphasis

            self.au_acc += self.deemph_y;
            self.au_cnt += 1;
            if self.au_cnt >= self.d2 {
                out.push((self.au_acc / self.d2 as f32).clamp(-1.0, 1.0));
                self.au_acc = 0.0;
                self.au_cnt = 0;
            }
        }
        out
    }
}

// ---------------------------------------------------------------------------
// Simulator — synth a believable spectrum per band so the app (and its missions)
// work and demo without a HackRF plugged in.
// ---------------------------------------------------------------------------

/// Tiny xorshift PRNG (no extra crate just for the simulator).
pub struct Rng(u64);
impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng(seed | 1)
    }
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }
    /// uniform 0..1
    fn unit(&mut self) -> f32 {
        (self.next() >> 40) as f32 / (1u64 << 24) as f32
    }
}

fn add_signal(db: &mut [f32], lo: f64, bin_hz: f64, freq: f64, bw_hz: f64, power: f32) {
    let c = ((freq - lo) / bin_hz) as i64;
    let half = ((bw_hz / bin_hz / 2.0) as i64).max(1);
    for k in (c - half)..=(c + half) {
        if k >= 0 && (k as usize) < db.len() {
            let d = (k - c) as f32 / half as f32;
            db[k as usize] = db[k as usize].max(power - 12.0 * d * d); // gaussian-ish lobe
        }
    }
}

/// Synthesize a dB spectrum for the tuned band (noise floor + band-appropriate signals).
pub fn synth(center_hz: f64, fs: f64, rng: &mut Rng) -> Vec<f32> {
    let lo = center_hz - fs / 2.0;
    let bin_hz = fs / N as f64;
    let mut db = vec![0f32; N];
    for v in db.iter_mut() {
        *v = -96.0 + rng.unit() * 4.0; // noise floor
    }

    let mhz = center_hz / 1e6;
    let in_window = |f_mhz: f64| (f_mhz * 1e6 - center_hz).abs() < fs / 2.0;

    if (87.0..109.0).contains(&mhz) {
        // FM broadcast stations
        for &st in &[89.1f64, 96.9, 100.2, 106.1] {
            if in_window(st) {
                add_signal(&mut db, lo, bin_hz, st * 1e6, 180e3, -55.0 + rng.unit() * 6.0);
            }
        }
    } else if (1080.0..1100.0).contains(&mhz) {
        // sporadic Mode S replies at 1090 (the aircraft themselves are synthesized
        // separately — see main.rs — this is just the visual signature)
        if rng.unit() < 0.6 {
            add_signal(&mut db, lo, bin_hz, 1090e6, 2e6, -60.0 - rng.unit() * 8.0);
        }
    } else if (430.0..435.0).contains(&mhz) || (867.0..869.0).contains(&mhz) {
        // sporadic narrowband ISM / LoRa bursts
        if rng.unit() < 0.5 {
            let off = (rng.unit() as f64 - 0.5) * fs * 0.6;
            add_signal(&mut db, lo, bin_hz, center_hz + off, 125e3, -58.0 - rng.unit() * 6.0);
        }
    } else if (2400.0..2484.0).contains(&mhz) {
        // a steady WiFi-ish carrier + an intermittent wideband drone video link
        add_signal(&mut db, lo, bin_hz, center_hz + (rng.unit() as f64 - 0.5) * fs * 0.5, 1.0e6, -68.0);
        if rng.unit() < 0.35 {
            let off = (rng.unit() as f64 - 0.5) * fs * 0.3;
            add_signal(&mut db, lo, bin_hz, center_hz + off, 9.0e6, -52.0 + rng.unit() * 4.0);
        }
    }
    db
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flat(noise: f32) -> Vec<f32> {
        vec![noise; N]
    }

    #[test]
    fn extract_finds_a_narrowband_peak() {
        let mut db = flat(-95.0);
        // a 20-bin carrier at +1 MHz from center, fs = 8 MHz → bin ≈ 1.95 kHz
        let c = N / 2 + (1e6 / (8e6 / N as f64)) as usize;
        for k in c - 10..=c + 10 {
            db[k] = -60.0;
        }
        let f = extract(&db, 100e6, 8e6, 32.0, &SdrInfo::default());
        assert_eq!(f.peaks.len(), 1);
        let p = &f.peaks[0];
        assert!((p.center_mhz - 101.0).abs() < 0.05, "center {}", p.center_mhz);
        assert!(p.snr_db > 30.0);
        assert!(!p.wideband);
        assert!(!f.drone_suspected);
    }

    #[test]
    fn extract_flags_wideband_as_drone() {
        let mut db = flat(-95.0);
        // 6 MHz-wide block at center, fs = 20 MHz
        let bins_6mhz = (6e6 / (20e6 / N as f64)) as usize;
        let s = N / 2 - bins_6mhz / 2;
        for k in s..s + bins_6mhz {
            db[k] = -65.0;
        }
        let f = extract(&db, 2440e6, 20e6, 40.0, &SdrInfo::default());
        assert!(f.drone_suspected);
        assert!(f.peaks.iter().any(|p| p.wideband && p.bandwidth_mhz >= 5.0));
    }

    #[test]
    fn trace_max_decimation_keeps_narrow_bursts_visible() {
        let mut db = flat(-95.0);
        db[1234] = -50.0; // single-bin spike (a LoRa-ish burst)
        let f = extract(&db, 868e6, 4e6, 40.0, &SdrInfo::default());
        let max = f.bins.iter().cloned().fold(f32::MIN, f32::max);
        assert!(max > -55.0, "spike lost by decimation: max {max}");
    }

    #[test]
    fn fm_demod_recovers_a_constant_offset() {
        // a carrier 30 kHz off-center must demodulate to ≈ 30/75 = 0.4
        let fs = 2.4e6;
        let mut demod = FmDemod::new(fs);
        let step = std::f32::consts::TAU * 30e3 / fs as f32;
        let iq: Vec<Complex<f32>> = (0..240_000)
            .map(|i| Complex::from_polar(1.0, step * i as f32))
            .collect();
        let pcm = demod.process(&iq, fs);
        let expected_rate = audio_rate_for(fs);
        let expected_len = (iq.len() as f64 / fs * expected_rate) as usize;
        assert!((pcm.len() as i64 - expected_len as i64).abs() <= 2);
        // after the de-emphasis filter settles, the tail must sit at 0.4
        let tail = &pcm[pcm.len() / 2..];
        let mean: f32 = tail.iter().sum::<f32>() / tail.len() as f32;
        assert!((mean - 0.4).abs() < 0.02, "mean {mean}");
    }

    #[test]
    fn audio_rate_close_to_48k_for_all_supported_rates() {
        for fs in [2e6, 2.4e6, 4e6, 8e6, 20e6] {
            let r = audio_rate_for(fs);
            assert!((40e3..60e3).contains(&r), "fs {fs} → audio {r}");
        }
    }
}
