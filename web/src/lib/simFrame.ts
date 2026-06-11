// Browser-side simulator — a faithful TypeScript port of the Rust engine's
// synth()/extract() (server/src/dsp.rs). Used as a fallback when no backend
// is reachable (the static Cloudflare Pages deployment), so the whole app —
// journey, console, missions — works with zero origin server.
// This is also the substrate for WebUSB: same pipeline, real samples later.

import type { Frame, Peak, Aircraft } from "./useRf";

const N = 2048;
const OUT_BINS = 256;
const SNR_DB = 8;
const WIDEBAND_MHZ = 5;

// current tuning, updated by tune() (mirrors the backend's SDR thread state)
const state = { centerHz: 98e6, fs: 8e6, gain: 32 };

export function simTune(centerMhz: number, srMsps?: number, gainDb?: number) {
  state.centerHz = Math.min(6000, Math.max(0.5, centerMhz)) * 1e6;
  if (srMsps) state.fs = Math.min(20, Math.max(0.25, srMsps)) * 1e6;
  if (gainDb != null) state.gain = Math.min(62, Math.max(0, gainDb));
}

function addSignal(db: Float32Array, lo: number, binHz: number, freq: number, bwHz: number, power: number) {
  const c = Math.round((freq - lo) / binHz);
  const half = Math.max(1, Math.round(bwHz / binHz / 2));
  for (let k = c - half; k <= c + half; k++) {
    if (k >= 0 && k < db.length) {
      const d = (k - c) / half;
      db[k] = Math.max(db[k], power - 12 * d * d); // gaussian-ish lobe
    }
  }
}

/** Synthesize a dB spectrum for the tuned band (port of dsp.rs::synth). */
function synth(): Float32Array {
  const { centerHz, fs } = state;
  const lo = centerHz - fs / 2;
  const binHz = fs / N;
  const db = new Float32Array(N);
  for (let i = 0; i < N; i++) db[i] = -96 + Math.random() * 4;

  const mhz = centerHz / 1e6;
  const inWindow = (fMhz: number) => Math.abs(fMhz * 1e6 - centerHz) < fs / 2;

  if (mhz >= 87 && mhz < 109) {
    for (const st of [89.1, 96.9, 100.2, 106.1]) {
      if (inWindow(st)) addSignal(db, lo, binHz, st * 1e6, 180e3, -55 + Math.random() * 6);
    }
  } else if (mhz >= 1080 && mhz < 1100) {
    if (Math.random() < 0.6) addSignal(db, lo, binHz, 1090e6, 2e6, -60 - Math.random() * 8);
  } else if ((mhz >= 430 && mhz < 435) || (mhz >= 867 && mhz < 869)) {
    if (Math.random() < 0.5) {
      const off = (Math.random() - 0.5) * fs * 0.6;
      addSignal(db, lo, binHz, centerHz + off, 125e3, -58 - Math.random() * 6);
    }
  } else if (mhz >= 2400 && mhz < 2484) {
    addSignal(db, lo, binHz, centerHz + (Math.random() - 0.5) * fs * 0.5, 1e6, -68);
    if (Math.random() < 0.35) {
      const off = (Math.random() - 0.5) * fs * 0.3;
      addSignal(db, lo, binHz, centerHz + off, 9e6, -52 + Math.random() * 4);
    }
  }
  return db;
}

/** Fake ADS-B traffic orbiting Montpellier (port of adsb.rs::sim_aircraft). */
function simAircraft(): Aircraft[] {
  const t = Date.now() / 1000;
  const planes: [string, string, number, number, number][] = [
    ["AFR1295", "39C4A1", 36000, 460, 0],
    ["EZY42QD", "440172", 24000, 410, 2.1],
    ["RYR9PD", "4CA8E5", 38000, 445, 4.2],
  ];
  return planes.map(([cs, icao, alt, kt, ph], i) => {
    const w = t / 120 + ph;
    return {
      icao,
      callsign: cs,
      alt_ft: alt,
      speed_kt: kt,
      track_deg: ((w * 180) / Math.PI + 90) % 360,
      vrate_fpm: 0,
      lat: 43.61 + 0.25 * Math.sin(w) + i * 0.08,
      lon: 3.88 + 0.32 * Math.cos(w) - i * 0.05,
      msgs: 40 + (Math.floor(t) % 60) * (i + 1),
      age_s: i * 1.7,
    };
  });
}

/** Turn the synthetic spectrum into a Frame (port of dsp.rs::extract). */
export function simFrame(): Frame {
  const { centerHz, fs, gain } = state;
  const db = synth();
  const n = db.length;
  const binHz = fs / n;

  const sorted = Float32Array.from(db).sort();
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

  const adsb = Math.abs(centerHz - 1090e6) < 2e6;
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
    sim: true,
    sdr: { present: false, driver: "sim-web", label: "Simulateur (navigateur)", serial: "" },
    audio_rate: 48000,
    aircraft: adsb ? simAircraft() : [],
    ts: Date.now() / 1000,
  };
}
