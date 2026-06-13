// Browser-side simulator — a faithful TypeScript port of the Rust engine's
// synth()/extract() (server/src/dsp.rs). Used as a fallback when no backend
// is reachable (the static Cloudflare Pages deployment), so the whole app —
// journey, console, missions — works with zero origin server.
// This is also the substrate for WebUSB: same pipeline, real samples later.

import type { Frame, Aircraft } from "./useRf";
import { extractFrame } from "./dsp";

const N = 2048;

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
  // Bursts that last a realistic ~1.8 s (so a mission's 1.2 s "hold" can
  // validate) then fall silent — a duty cycle, not per-frame coin flips.
  const bursting = (offsetMs: number, periodMs = 3000, onMs = 1800) =>
    (Date.now() + offsetMs) % periodMs < onMs;

  if (mhz >= 87 && mhz < 109) {
    for (const st of [89.1, 96.9, 100.2, 106.1]) {
      if (inWindow(st)) addSignal(db, lo, binHz, st * 1e6, 180e3, -55 + Math.random() * 6);
    }
  } else if (mhz >= 108 && mhz < 138) {
    // airband AM: narrow (~8 kHz), short intermittent voice transmissions
    [118.1, 121.5, 124.0, 127.8, 130.2].forEach((ch, i) => {
      if (inWindow(ch) && bursting(i * 700)) {
        addSignal(db, lo, binHz, ch * 1e6, 8e3, -57 - Math.random() * 8);
      }
    });
  } else if (mhz >= 465 && mhz < 467) {
    // POCSAG paging: ~16 kHz FSK bursts, grouped then silent
    if (bursting(0, 3500, 1900)) {
      const off = Math.sin(Date.now() / 1700) * fs * 0.3;
      addSignal(db, lo, binHz, centerHz + off, 18e3, -56 - Math.random() * 6);
    }
  } else if (mhz >= 1080 && mhz < 1100) {
    if (Math.random() < 0.6) addSignal(db, lo, binHz, 1090e6, 2e6, -60 - Math.random() * 8);
  } else if ((mhz >= 430 && mhz < 435) || (mhz >= 867 && mhz < 869)) {
    // ISM bursts: a sensor wakes, transmits ~1.8 s, sleeps
    if (bursting(0, 3200, 1800)) {
      const off = Math.sin(Date.now() / 900) * fs * 0.3;
      addSignal(db, lo, binHz, centerHz + off, 125e3, -58 - Math.random() * 6);
    }
  } else if (mhz >= 2400 && mhz < 2484) {
    // narrow WiFi/BT chatter (keeps occupancy up) + a wideband video link that
    // comes and goes like a real drone — held long enough to be recognised
    addSignal(db, lo, binHz, centerHz + Math.sin(Date.now() / 700) * fs * 0.4, 1e6, -66);
    if (bursting(0, 3600, 2000)) {
      const off = Math.sin(Date.now() / 1500) * fs * 0.25;
      addSignal(db, lo, binHz, centerHz + off, 9e6, -52 + Math.random() * 4);
    }
  }
  return db;
}

// Where the fake traffic orbits. A neutral default; the map view moves it
// over the user once geolocation is known, so the demo feels local.
const origin = { lat: 30, lon: 5 };
export function setSimOrigin(lat: number, lon: number) {
  origin.lat = lat;
  origin.lon = lon;
}

/** Fake ADS-B traffic orbiting the sim origin (port of adsb.rs::sim_aircraft). */
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
      lat: origin.lat + 0.25 * Math.sin(w) + i * 0.08,
      lon: origin.lon + 0.32 * Math.cos(w) - i * 0.05,
      msgs: 40 + (Math.floor(t) % 60) * (i + 1),
      age_s: i * 1.7,
    };
  });
}

/** Turn the synthetic spectrum into a Frame (shared extractor in dsp.ts). */
export function simFrame(): Frame {
  const { centerHz, fs, gain } = state;
  const frame = extractFrame(synth(), centerHz, fs, gain, {
    present: false,
    driver: "sim-web",
    label: "Simulateur (navigateur)",
    serial: "",
  });
  if (Math.abs(centerHz - 1090e6) < 2e6) frame.aircraft = simAircraft();
  return frame;
}
