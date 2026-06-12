// WebUSB RTL-SDR source: the browser drives the dongle directly (Chrome/Edge,
// HTTPS) and the DSP runs client-side — no server involved at all.
// Driver: @jtarrio/webrtlsdr (Apache-2.0), loaded lazily so non-Chrome
// browsers and the common no-hardware path never pay for it.
//
// Events on window:
//   "rfa-usb"        detail: { active: boolean, error?: string }
//   "rfa-usb-frame"  detail: Frame
// useRf.ts arbitrates: WebUSB > backend WebSocket > browser simulator.

import type { Frame } from "./useRf";
import { SpectrumAnalyzer, FmAudio, extractFrame, FFT_N } from "./dsp";

type RtlDevice = {
  setSampleRate(rate: number): Promise<number>;
  setGain(gain: number | null): Promise<void>;
  setCenterFrequency(freq: number): Promise<number>;
  resetBuffer(): Promise<void>;
  readSamples(length: number): Promise<{ frequency: number; data: ArrayBuffer }>;
  close(): Promise<void>;
};

const SAMPLE_RATE = 2_048_000; // the RTL2832U's happy place
const READ_SAMPLES = FFT_N * 16; // 32k samples ≈ 16 ms per read
const FRAME_EVERY_MS = 125; // UI frame cadence (~8 fps, like the backend)
// R820T/R828D tuner range; the UI clamps mission tunes into it
const MIN_HZ = 24e6;
const MAX_HZ = 1766e6;

const state = {
  dev: null as RtlDevice | null,
  running: false,
  centerHz: 100.2e6,
  actualHz: 100.2e6,
  gain: null as number | null, // null = AGC
  retune: false,
  audioOn: false,
  audio: null as { ctx: AudioContext; next: number; demod: FmAudio } | null,
};

export const usbSupported = () =>
  typeof navigator !== "undefined" && !!(navigator as Navigator & { usb?: unknown }).usb;

export const usbActive = () => state.running;

function emitState(error?: string) {
  window.dispatchEvent(new CustomEvent("rfa-usb", { detail: { active: state.running, error } }));
}

/** Queue a retune; the streaming loop applies it between reads. */
export function usbTune(centerMhz: number, _srMsps?: number, gainDb?: number) {
  state.centerHz = Math.min(MAX_HZ, Math.max(MIN_HZ, centerMhz * 1e6));
  if (gainDb != null) state.gain = gainDb >= 60 ? null : Math.min(49.6, Math.max(0, gainDb));
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

/** Must be called from a user gesture (the browser shows its device picker). */
export async function usbConnect(): Promise<void> {
  if (state.running) return;
  try {
    const { RTL2832U_Provider } = await import("@jtarrio/webrtlsdr/rtlsdr.js");
    const dev = (await new RTL2832U_Provider().get()) as RtlDevice;
    await dev.setSampleRate(SAMPLE_RATE);
    await dev.setGain(state.gain);
    state.actualHz = await dev.setCenterFrequency(state.centerHz);
    await dev.resetBuffer();
    state.dev = dev;
    state.running = true;
    emitState();
    void streamLoop(dev);
  } catch (e) {
    state.running = false;
    state.dev = null;
    emitState(e instanceof Error ? e.message : String(e));
    throw e;
  }
}

async function streamLoop(dev: RtlDevice) {
  const analyzer = new SpectrumAnalyzer();
  let lastFrame = performance.now();
  try {
    while (state.running) {
      if (state.retune) {
        state.retune = false;
        state.actualHz = await dev.setCenterFrequency(state.centerHz);
        await dev.setGain(state.gain);
        await dev.resetBuffer();
        if (state.audio) state.audio.next = 0; // resync after the gap
      }
      const block = await dev.readSamples(READ_SAMPLES);
      const iq = new Uint8Array(block.data);
      analyzer.feed(iq);
      if (state.audioOn) playFm(iq);

      const now = performance.now();
      if (now - lastFrame >= FRAME_EVERY_MS) {
        lastFrame = now;
        const db = analyzer.renderDb();
        if (db) {
          const frame: Frame = extractFrame(
            db,
            state.actualHz,
            SAMPLE_RATE,
            state.gain ?? 62, // 62 shown as "auto" ceiling on the UI slider
            { present: true, driver: "rtlsdr-webusb", label: "RTL-SDR (WebUSB)", serial: "" },
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
      await dev.close();
    } catch {
      /* already gone */
    }
    state.dev = null;
    emitState();
  }
}

/** Demodulate and schedule FM audio straight from the IQ stream. */
function playFm(iq: Uint8Array) {
  if (!state.audio) {
    const demod = new FmAudio(SAMPLE_RATE);
    state.audio = { ctx: new AudioContext(), next: 0, demod };
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
