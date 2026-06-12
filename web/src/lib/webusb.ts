// WebUSB SDR sources: the browser drives the radio directly (Chrome/Edge,
// HTTPS) and the DSP runs client-side — no server involved at all.
// Two drivers:
//   • RTL-SDR (RTL2832U) via @jtarrio/webrtlsdr (Apache-2.0, lazy chunk)
//   • HackRF One via our own driver (lib/hackrf.ts)
//
// Events on window:
//   "rfa-usb"        detail: { active: boolean, error?: string }
//   "rfa-usb-frame"  detail: Frame
// useRf.ts arbitrates: WebUSB > backend WebSocket > browser simulator.

import type { Frame } from "./useRf";
import { SpectrumAnalyzer, FmAudio, extractFrame, FFT_N } from "./dsp";

const FRAME_EVERY_MS = 125; // UI frame cadence (~8 fps, like the backend)

/** What the streaming loop needs, whatever the hardware underneath. */
type Source = {
  label: string;
  driver: string;
  serial: string;
  fs: number;
  minHz: number;
  maxHz: number;
  /** Hot retune; may change fs (HackRF). Returns the actual centre. */
  tune(hz: number, fsWanted: number, uiGain: number | null): Promise<number>;
  /** One block of offset-128 unsigned IQ. */
  read(): Promise<Uint8Array>;
  close(): Promise<void>;
};

const state = {
  src: null as Source | null,
  running: false,
  centerHz: 100.2e6,
  actualHz: 100.2e6,
  fsWanted: 8e6,
  gain: null as number | null, // null = auto/defaults
  retune: false,
  audioOn: false,
  audio: null as { ctx: AudioContext; next: number; demod: FmAudio; fs: number } | null,
};

export const usbSupported = () =>
  typeof navigator !== "undefined" && !!(navigator as Navigator & { usb?: unknown }).usb;

export const usbActive = () => state.running;

function emitState(error?: string) {
  window.dispatchEvent(new CustomEvent("rfa-usb", { detail: { active: state.running, error } }));
}

/** Queue a retune; the streaming loop applies it between reads. */
export function usbTune(centerMhz: number, srMsps?: number, gainDb?: number) {
  state.centerHz = centerMhz * 1e6;
  if (srMsps) state.fsWanted = srMsps * 1e6;
  if (gainDb != null) state.gain = gainDb >= 60 ? null : gainDb;
  state.retune = true;
}

export function usbSetAudio(on: boolean) {
  state.audioOn = on;
  if (!on && state.audio) {
    state.audio.ctx.close().catch(() => {});
    state.audio = null;
  }
}

export async function usbDisconnect() {
  state.running = false; // the loop notices, closes the device and emits
}

/* ── drivers ─────────────────────────────────────────────────────────────── */

async function openRtl(dev: USBDevice): Promise<Source> {
  const { RTL2832U } = await import("@jtarrio/webrtlsdr/rtlsdr.js");
  const rtl = await RTL2832U.open(dev);
  const fs = await rtl.setSampleRate(2_048_000);
  await rtl.setGain(null);
  await rtl.resetBuffer();
  return {
    label: "RTL-SDR (WebUSB)",
    driver: "rtlsdr-webusb",
    serial: dev.serialNumber || "",
    fs,
    minHz: 24e6,
    maxHz: 1766e6,
    async tune(hz, _fsWanted, uiGain) {
      const actual = await rtl.setCenterFrequency(hz);
      await rtl.setGain(uiGain == null ? null : Math.min(49.6, Math.max(0, uiGain)));
      await rtl.resetBuffer();
      return actual;
    },
    async read() {
      const block = await rtl.readSamples(FFT_N * 16);
      return new Uint8Array(block.data);
    },
    close: () => rtl.close(),
  };
}

async function openHackRf(dev: USBDevice): Promise<Source> {
  const { HackRf } = await import("./hackrf");
  const h = await HackRf.open(dev);
  const src: Source & { h: typeof h } = {
    h,
    label: "HackRF One (WebUSB)",
    driver: "hackrf-webusb",
    serial: h.serial,
    fs: 0,
    minHz: 1e6,
    maxHz: 6000e6,
    async tune(hz, fsWanted, uiGain) {
      // browser CPU budget: 2–10 MSps (the 20 MSps bands show a 10 MHz window)
      const fs = Math.min(10e6, Math.max(2e6, fsWanted));
      if (fs !== src.fs) {
        await h.setSampleRate(fs);
        src.fs = fs;
      }
      await h.setFrequency(hz);
      // map the single UI gain (0–62) onto the LNA/VGA pair
      const g = uiGain == null ? 40 : uiGain;
      await h.setGains(Math.min(40, Math.round((g * 0.65) / 8) * 8), Math.round((g * 0.9) / 2) * 2);
      return hz;
    },
    async read() {
      // bigger blocks than the RTL path: the HackRF streams much faster, and
      // fewer/larger bulk transfers keep the audio path gap-free
      return h.readSamples(FFT_N * 64);
    },
    close: () => h.close(),
  };
  await src.tune(state.centerHz, state.fsWanted, state.gain);
  await h.startRx();
  return src;
}

/* ── connection & streaming ──────────────────────────────────────────────── */

/** Must be called from a user gesture (the browser shows its device picker). */
export async function usbConnect(): Promise<void> {
  if (state.running) return;
  try {
    const { HACKRF_FILTERS } = await import("./hackrf");
    const usb = (navigator as Navigator & { usb: USB }).usb;
    const dev = await usb.requestDevice({
      filters: [
        { vendorId: 0x0bda, productId: 0x2832 }, // RTL2832U
        { vendorId: 0x0bda, productId: 0x2838 },
        ...HACKRF_FILTERS,
      ],
    });
    const src = dev.vendorId === 0x1d50 ? await openHackRf(dev) : await openRtl(dev);
    // first tune (RTL path tunes here; HackRF already tuned in open)
    state.actualHz = await src.tune(
      Math.min(src.maxHz, Math.max(src.minHz, state.centerHz)),
      state.fsWanted,
      state.gain,
    );
    state.src = src;
    state.running = true;
    emitState();
    void streamLoop(src);
  } catch (e) {
    state.running = false;
    state.src = null;
    emitState(e instanceof Error ? e.message : String(e));
    throw e;
  }
}

async function streamLoop(src: Source) {
  const analyzer = new SpectrumAnalyzer();
  let lastFrame = performance.now();
  try {
    while (state.running) {
      if (state.retune) {
        state.retune = false;
        const hz = Math.min(src.maxHz, Math.max(src.minHz, state.centerHz));
        state.actualHz = await src.tune(hz, state.fsWanted, state.gain);
        if (state.audio) state.audio.next = 0; // resync after the gap
      }
      const iq = await src.read();
      if (iq.length === 0) continue;
      analyzer.feed(iq);
      if (state.audioOn) playFm(iq, src.fs);

      const now = performance.now();
      if (now - lastFrame >= FRAME_EVERY_MS) {
        lastFrame = now;
        const db = analyzer.renderDb();
        if (db) {
          const frame: Frame = extractFrame(
            db,
            state.actualHz,
            src.fs,
            state.gain ?? 62,
            { present: true, driver: src.driver, label: src.label, serial: src.serial },
            state.audio?.demod.rate ?? 48000,
          );
          window.dispatchEvent(new CustomEvent("rfa-usb-frame", { detail: frame }));
        }
      }
    }
  } catch (e) {
    // device unplugged or USB stall — fall back gracefully
    emitState(e instanceof Error ? e.message : String(e));
  } finally {
    state.running = false;
    usbSetAudio(false);
    try {
      await src.close();
    } catch {
      /* already gone */
    }
    state.src = null;
    emitState();
  }
}

/** Demodulate and schedule FM audio straight from the IQ stream. */
function playFm(iq: Uint8Array, fs: number) {
  if (state.audio && state.audio.fs !== fs) {
    state.audio.ctx.close().catch(() => {});
    state.audio = null;
  }
  if (!state.audio) {
    const demod = new FmAudio(fs);
    state.audio = { ctx: new AudioContext(), next: 0, demod, fs };
  }
  const a = state.audio;
  const pcm = a.demod.process(iq);
  if (!pcm.length) return;
  const buf = a.ctx.createBuffer(1, pcm.length, Math.min(96000, Math.max(8000, a.demod.rate)));
  buf.getChannelData(0).set(pcm);
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  src.connect(a.ctx.destination);
  const t = Math.max(a.next, a.ctx.currentTime + 0.06);
  src.start(t);
  a.next = t + buf.duration;
}
