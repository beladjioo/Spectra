import { useEffect, useRef, useState } from "react";
import Spectrum from "./Spectrum";
import Waterfall from "./Waterfall";
import AircraftTable from "./Aircraft";
import { tune, type Frame } from "../lib/useRf";
import { useI18n, STR, fmt, type LStr } from "../lib/i18n";

type Preset = { label: LStr; hint: LStr; mhz: number; sr: number; gain: number; note?: string };
const PRESETS: Preset[] = [
  { label: STR.presets.fm, hint: STR.presets.fmHint, mhz: 100.2, sr: 8, gain: 32, note: "modulations" },
  { label: STR.presets.air, hint: STR.presets.airHint, mhz: 124.0, sr: 8, gain: 40 },
  { label: STR.presets.adsb, hint: STR.presets.adsbHint, mhz: 1090, sr: 8, gain: 40, note: "bandes-a-explorer" },
  { label: STR.presets.ism, hint: STR.presets.ismHint, mhz: 868.3, sr: 4, gain: 40, note: "bandes-a-explorer" },
  { label: STR.presets.wifi, hint: STR.presets.wifiHint, mhz: 2440, sr: 20, gain: 40, note: "modulations" },
];
const STEPS = [-10, -1, -0.1, 0.1, 1, 10];
const RATES = [2, 4, 8, 20];

/** Free-tuning SDR console: drive the radio live (frequency / bandwidth / gain). */
export default function Console({
  frame,
  onLearn,
}: {
  frame: Frame | null;
  onLearn: (slug: string) => void;
}) {
  const { t } = useI18n();
  const [mhz, setMhz] = useState(100.2);
  const [sr, setSr] = useState(8);
  const [gain, setGain] = useState(32);
  const [listening, setListening] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; ws: WebSocket; next: number } | null>(null);
  // exact PCM rate of the backend stream (depends on the SDR sample rate)
  const rateRef = useRef(48000);
  useEffect(() => {
    if (frame?.audio_rate) rateRef.current = Math.min(96000, Math.max(8000, frame.audio_rate));
  }, [frame?.audio_rate]);

  // push tuning to the radio whenever a control changes
  useEffect(() => {
    tune(mhz, sr, gain);
  }, [mhz, sr, gain]);

  const oscRef = useRef<{ ctx: AudioContext; osc: OscillatorNode } | null>(null);

  const stopAudio = () => {
    fetch("/api/audio?on=false", { method: "POST" }).catch(() => {});
    const a = audioRef.current;
    if (a) {
      a.ws.close();
      a.ctx.close().catch(() => {});
      audioRef.current = null;
    }
    const o = oscRef.current;
    if (o) {
      o.osc.stop();
      o.ctx.close().catch(() => {});
      oscRef.current = null;
    }
    setListening(false);
  };

  const startAudio = () => {
    // browser-simulator mode (static deployment): local 440 Hz test tone,
    // no backend audio stream to subscribe to
    if (frame?.sdr.driver === "sim-web") {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.frequency.value = 440;
      vol.gain.value = 0.15;
      osc.connect(vol).connect(ctx.destination);
      osc.start();
      oscRef.current = { ctx, osc };
      setListening(true);
      return;
    }
    const ctx = new AudioContext();
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/audio`);
    ws.binaryType = "arraybuffer";
    const st = { ctx, ws, next: 0 };
    audioRef.current = st;
    ws.onopen = () => fetch("/api/audio?on=true", { method: "POST" }).catch(() => {});
    ws.onmessage = (e) => {
      const i16 = new Int16Array(e.data as ArrayBuffer);
      if (!i16.length) return;
      const buf = ctx.createBuffer(1, i16.length, rateRef.current);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const tplay = Math.max(st.next, ctx.currentTime + 0.05); // small lead to avoid underruns
      src.start(tplay);
      st.next = tplay + buf.duration;
    };
    ws.onclose = () => {
      if (audioRef.current === st) stopAudio();
    };
    setListening(true);
  };

  // stop audio when leaving the console
  useEffect(() => () => stopAudio(), []); // eslint-disable-line

  const setFreq = (v: number) => setMhz(Math.min(6000, Math.max(1, +v.toFixed(3))));
  const strongest = frame?.peaks?.[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* main: controls + live RF */}
      <div className="flex flex-col gap-4">
        {/* VFO */}
        <section className="rounded-2xl border border-edge bg-panel p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">{t(STR.console.vfo)}</div>
              <div className="font-display text-5xl font-extrabold tabular-nums tracking-tight text-amber drop-shadow-[0_0_18px_rgba(255,180,84,.25)]">
                {mhz.toFixed(3)} <span className="text-lg text-muted">MHz</span>
              </div>
            </div>
            <input
              type="number"
              value={mhz}
              step={0.1}
              onChange={(e) => setFreq(parseFloat(e.target.value) || mhz)}
              className="w-32 rounded-lg border border-edge bg-ink px-3 py-2 text-right font-mono outline-none focus:border-phos"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STEPS.map((d) => (
              <button
                key={d}
                onClick={() => setFreq(mhz + d)}
                className="rounded-lg border border-edge bg-ink px-3 py-1.5 font-mono text-sm hover:border-phos"
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
          <button
            onClick={listening ? stopAudio : startAudio}
            className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              listening ? "bg-rose-500 text-white" : "bg-phos text-ink"
            }`}
          >
            {listening ? `■ ${t(STR.console.stop)}` : `🔊 ${t(STR.console.listenFm)}`}
          </button>
          <p className="mt-1 text-xs text-muted">{t(STR.console.listenHint)}</p>
        </section>

        {/* spectrum + waterfall */}
        <section className="crt border border-edge/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.console.spectrum)}</h3>
            <Readout frame={frame} />
          </div>
          <Spectrum frame={frame} />
        </section>
        {(frame?.aircraft?.length ?? 0) > 0 && (
          <section className="rounded-2xl border border-edge bg-panel p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              ✈️ {t(STR.mission.aircraft)}
            </h3>
            <AircraftTable list={frame!.aircraft} />
          </section>
        )}
        <section className="crt border border-edge/70 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.console.waterfall)}</h3>
          <Waterfall frame={frame} />
        </section>
      </div>

      {/* side: presets, bandwidth, gain, help */}
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.console.presets)}</h3>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.mhz}
                onClick={() => {
                  setMhz(p.mhz);
                  setSr(p.sr);
                  setGain(p.gain);
                }}
                className={`flex flex-col rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  Math.abs(mhz - p.mhz) < 0.001 ? "border-phos/60 bg-phos/5" : "border-edge bg-ink hover:border-phos"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="font-semibold">{t(p.label)}</span>
                  <span className="font-mono text-xs text-amber">{p.mhz} MHz</span>
                </span>
                <span className="text-xs text-muted">{t(p.hint)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {t(STR.console.bandwidth)} <span className="normal-case text-slate-500">(sample rate)</span>
          </h3>
          <div className="flex gap-2">
            {RATES.map((r) => (
              <button
                key={r}
                onClick={() => setSr(r)}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold ${
                  sr === r ? "bg-phos text-ink" : "border border-edge bg-ink hover:border-phos"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{fmt(t(STR.console.bandwidthHint), { n: sr })}</p>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.console.gain)}</h3>
            <span className="font-mono text-sm">{gain} dB</span>
          </div>
          <input
            type="range"
            min={0}
            max={62}
            step={2}
            value={gain}
            onChange={(e) => setGain(parseInt(e.target.value))}
            className="w-full accent-phos"
          />
          <p className="mt-2 text-xs text-muted">{t(STR.console.gainHint)}</p>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.console.understand)}</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <HelpLink onLearn={onLearn} slug="fft-spectre" label={t(STR.console.helpSpectrum)} />
            <HelpLink onLearn={onLearn} slug="waterfall" label={t(STR.console.helpWaterfall)} />
            <HelpLink onLearn={onLearn} slug="hackrf" label={t(STR.console.helpGain)} />
            <HelpLink onLearn={onLearn} slug="modulations" label={t(STR.console.helpMod)} />
            <HelpLink onLearn={onLearn} slug="bandes-a-explorer" label={t(STR.console.helpBands)} />
          </div>
          {strongest && (
            <p className="mt-3 text-xs text-muted">
              {t(STR.console.strongestPeak)}{" "}
              <b className="text-slate-200">{strongest.center_mhz.toFixed(2)} MHz</b> (
              {strongest.snr_db.toFixed(0)} dB SNR, {strongest.bandwidth_mhz.toFixed(2)} MHz {t(STR.console.wide)}).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Readout({ frame }: { frame: Frame | null }) {
  const { t } = useI18n();
  if (!frame) return <span className="font-mono text-xs text-muted">—</span>;
  return (
    <span className="flex gap-3 font-mono text-xs text-muted">
      <span>
        {t(STR.mission.noise)} <b className="text-slate-300">{frame.noise_floor_db.toFixed(0)}</b>
      </span>
      <span>
        {t(STR.mission.peak)} <b className="text-slate-300">{frame.peak_db.toFixed(0)}</b>
      </span>
      <span>
        {t(STR.mission.occ)} <b className="text-slate-300">{(frame.occupancy * 100).toFixed(0)}</b>%
      </span>
    </span>
  );
}

function HelpLink({ onLearn, slug, label }: { onLearn: (s: string) => void; slug: string; label: string }) {
  return (
    <button
      onClick={() => onLearn(slug)}
      className="rounded-full border border-edge px-3 py-1 text-xs text-phos hover:border-phos"
    >
      {label}
    </button>
  );
}
