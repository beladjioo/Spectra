// Client-side DSP for the WebUSB path (and shared by the simulator):
// Hann-windowed FFT spectrum accumulation, Frame extraction, FM demodulation.
// Mirrors server/src/dsp.rs so the UI sees identical Frames whatever the source.

import type { Frame, Peak } from "./useRf";

export const FFT_N = 2048;
export const OUT_BINS = 256;
const SNR_DB = 8;
const WIDEBAND_MHZ = 5;

/* ── FFT (iterative radix-2, fixed size) ─────────────────────────────────── */

export class Fft {
  private rev: Uint32Array;
  private cos: Float32Array;
  private sin: Float32Array;

  constructor(readonly n: number) {
    if ((n & (n - 1)) !== 0) throw new Error("FFT size must be a power of two");
    this.rev = new Uint32Array(n);
    const bits = Math.log2(n);
    for (let i = 0; i < n; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) r = (r << 1) | ((i >> b) & 1);
      this.rev[i] = r;
    }
    this.cos = new Float32Array(n / 2);
    this.sin = new Float32Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      this.cos[i] = Math.cos((-2 * Math.PI * i) / n);
      this.sin[i] = Math.sin((-2 * Math.PI * i) / n);
    }
  }

  /** In-place complex FFT. */
  transform(re: Float32Array, im: Float32Array) {
    const { n, rev, cos, sin } = this;
    for (let i = 0; i < n; i++) {
      const r = rev[i];
      if (r > i) {
        let t = re[i]; re[i] = re[r]; re[r] = t;
        t = im[i]; im[i] = im[r]; im[r] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const l = j + half;
          const tre = re[l] * cos[k] - im[l] * sin[k];
          const tim = re[l] * sin[k] + im[l] * cos[k];
          re[l] = re[j] - tre;
          im[l] = im[j] - tim;
          re[j] += tre;
          im[j] += tim;
        }
      }
    }
  }
}

/* ── spectrum accumulation from raw RTL u8 IQ ────────────────────────────── */

export class SpectrumAnalyzer {
  private fft = new Fft(FFT_N);
  private win: Float32Array;
  private acc = new Float32Array(FFT_N);
  private re = new Float32Array(FFT_N);
  private im = new Float32Array(FFT_N);
  private frames = 0;

  constructor() {
    this.win = new Float32Array(FFT_N);
    for (let i = 0; i < FFT_N; i++) {
      this.win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_N - 1)));
    }
  }

  /** Feed interleaved unsigned-8-bit IQ; whole FFT_N chunks are consumed. */
  feed(iq: Uint8Array) {
    const chunk = FFT_N * 2;
    for (let off = 0; off + chunk <= iq.length; off += chunk) {
      for (let i = 0; i < FFT_N; i++) {
        const w = this.win[i];
        this.re[i] = ((iq[off + 2 * i] - 127.5) / 127.5) * w;
        this.im[i] = ((iq[off + 2 * i + 1] - 127.5) / 127.5) * w;
      }
      this.fft.transform(this.re, this.im);
      for (let i = 0; i < FFT_N; i++) {
        this.acc[i] += this.re[i] * this.re[i] + this.im[i] * this.im[i];
      }
      this.frames++;
    }
  }

  /** fftshifted dB spectrum since the last call, or null if nothing was fed. */
  renderDb(): Float32Array | null {
    if (this.frames === 0) return null;
    const n = FFT_N;
    const db = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const src = (i + n / 2) % n; // DC to centre
      db[i] = 10 * Math.log10(this.acc[src] / this.frames / n + 1e-12);
    }
    this.acc.fill(0);
    this.frames = 0;
    return db;
  }
}

/* ── dB spectrum → Frame (port of dsp.rs::extract) ───────────────────────── */

export function extractFrame(
  db: ArrayLike<number>,
  centerHz: number,
  fs: number,
  gain: number,
  sdr: Frame["sdr"],
  audioRate = 48000,
): Frame {
  const n = db.length;
  const binHz = fs / n;

  const sorted = Float32Array.from(db as Float32Array).sort();
  const noise = sorted[Math.floor(n / 5)];
  const peakDb = sorted[n - 1];
  const thr = noise + SNR_DB;

  const peaks: Peak[] = [];
  let occupied = 0;
  let i = 0;
  while (i < n) {
    if (db[i] > thr) {
      const start = i;
      let pk = db[i];
      while (i < n && db[i] > thr) {
        pk = Math.max(pk, db[i]);
        occupied++;
        i++;
      }
      const w = i - start;
      const bw = (w * binHz) / 1e6;
      const mid = start + Math.floor(w / 2);
      const off = (mid - n / 2) * binHz;
      peaks.push({
        center_mhz: (centerHz + off) / 1e6,
        bandwidth_mhz: bw,
        power_db: pk,
        snr_db: pk - noise,
        wideband: bw >= WIDEBAND_MHZ,
      });
    } else i++;
  }
  peaks.sort((a, b) => b.snr_db - a.snr_db);
  peaks.length = Math.min(peaks.length, 12);

  const step = Math.max(1, Math.floor(n / OUT_BINS));
  const bins: number[] = [];
  for (let k = 0; k < OUT_BINS; k++) {
    const a = Math.min(k * step, n - 1);
    const b = Math.min((k + 1) * step, n);
    let m = -Infinity;
    for (let j = a; j < Math.max(b, a + 1); j++) m = Math.max(m, db[j]);
    bins.push(m);
  }

  return {
    center_mhz: centerHz / 1e6,
    span_mhz: fs / 1e6,
    sample_rate_msps: fs / 1e6,
    gain_db: gain,
    noise_floor_db: noise,
    peak_db: peakDb,
    occupancy: occupied / n,
    peaks,
    drone_suspected: peaks.some((p) => p.wideband),
    bins,
    sim: !sdr.present,
    sdr,
    audio_rate: audioRate,
    aircraft: [],
    ts: Date.now() / 1000,
  };
}

/* ── broadcast-FM demodulator (port of dsp.rs::FmDemod) ──────────────────── */

const FM_IF_RATE = 240e3;
const FM_AUDIO_TARGET = 48e3;
const FM_DEVIATION_HZ = 75e3;
const DEEMPHASIS_S = 50e-6;

export class FmAudio {
  private d1: number;
  private d2: number;
  readonly rate: number;
  private iqI = 0;
  private iqQ = 0;
  private iqCnt = 0;
  private lastI = 0;
  private lastQ = 0;
  private deemphA: number;
  private deemphY = 0;
  private auAcc = 0;
  private auCnt = 0;
  private gain: number;

  constructor(fs: number) {
    this.d1 = Math.max(1, Math.round(fs / FM_IF_RATE));
    const ifRate = fs / this.d1;
    this.d2 = Math.max(1, Math.round(ifRate / FM_AUDIO_TARGET));
    this.rate = fs / (this.d1 * this.d2);
    this.deemphA = 1 - Math.exp(-1 / ifRate / DEEMPHASIS_S);
    this.gain = ifRate / (2 * Math.PI * FM_DEVIATION_HZ);
  }

  /** Demodulate u8 IQ into mono PCM at `this.rate`. */
  process(iq: Uint8Array): Float32Array {
    const out: number[] = [];
    for (let k = 0; k + 1 < iq.length; k += 2) {
      this.iqI += (iq[k] - 127.5) / 127.5;
      this.iqQ += (iq[k + 1] - 127.5) / 127.5;
      if (++this.iqCnt < this.d1) continue;
      const zi = this.iqI / this.d1;
      const zq = this.iqQ / this.d1;
      this.iqI = this.iqQ = 0;
      this.iqCnt = 0;

      // instantaneous frequency = arg(z · conj(prev))
      const pi = zi * this.lastI + zq * this.lastQ;
      const pq = zq * this.lastI - zi * this.lastQ;
      this.lastI = zi;
      this.lastQ = zq;
      const demod = Math.atan2(pq, pi) * this.gain;
      this.deemphY += this.deemphA * (demod - this.deemphY);

      this.auAcc += this.deemphY;
      if (++this.auCnt >= this.d2) {
        out.push(Math.max(-1, Math.min(1, this.auAcc / this.d2)));
        this.auAcc = 0;
        this.auCnt = 0;
      }
    }
    return Float32Array.from(out);
  }
}
