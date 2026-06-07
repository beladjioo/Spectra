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
pub const AUDIO_RATE: f64 = 48000.0; // demodulated audio sample rate
const SNR_DB: f32 = 8.0; // a bin is "occupied" above noise + SNR_DB
const WIDEBAND_MHZ: f32 = 5.0; // a band this wide ≈ an OFDM video link (drone)

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
    pub ts: f64,
}

fn now_ts() -> f64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs_f64()
}

/// Averages FFT power frames from live IQ, then renders a dB spectrum.
pub struct Analyzer {
    fft: Arc<dyn Fft<f32>>,
    acc: Vec<f32>,
    scratch: Vec<Complex<f32>>,
    frames: usize,
}

impl Analyzer {
    pub fn new() -> Self {
        let mut planner = FftPlanner::<f32>::new();
        Self {
            fft: planner.plan_fft_forward(N),
            acc: vec![0.0; N],
            scratch: vec![Complex::new(0.0, 0.0); N],
            frames: 0,
        }
    }

    pub fn accumulate(&mut self, buf: &[Complex<f32>]) {
        if buf.len() < N {
            return;
        }
        self.scratch.copy_from_slice(&buf[..N]);
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

    let step = (n / OUT_BINS).max(1);
    let bins: Vec<f32> = (0..OUT_BINS).map(|k| db[(k * step).min(n - 1)]).collect();

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
        ts: now_ts(),
    }
}

/// FM-demodulate IQ whose carrier sits at DC (we tune the radio onto the station),
/// then boxcar-low-pass + decimate down to `AUDIO_RATE`. Returns mono PCM ~[-1, 1].
/// `last` carries the previous sample across calls for a continuous phase.
pub fn fm_demod(iq: &[Complex<f32>], fs: f64, last: &mut Complex<f32>) -> Vec<f32> {
    let decim = (fs / AUDIO_RATE).max(1.0) as usize;
    let gain = 1.0 / std::f32::consts::PI; // normalise phase step to ~[-1, 1]
    let mut out = Vec::with_capacity(iq.len() / decim + 1);
    let mut acc = 0f32;
    let mut cnt = 0usize;
    for &s in iq {
        let p = s * last.conj(); // instantaneous freq = arg(s · conj(prev))
        *last = s;
        acc += p.im.atan2(p.re) * gain;
        cnt += 1;
        if cnt >= decim {
            out.push((acc / cnt as f32).clamp(-1.0, 1.0)); // boxcar LPF + decimate
            acc = 0.0;
            cnt = 0;
        }
    }
    out
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
