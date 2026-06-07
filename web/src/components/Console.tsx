import { useEffect, useRef, useState } from "react";
import Spectrum from "./Spectrum";
import Waterfall from "./Waterfall";
import { tune, type Frame } from "../lib/useRf";

type Preset = { label: string; mhz: number; sr: number; gain: number; note?: string };
const PRESETS: Preset[] = [
  { label: "Radio FM", mhz: 100.2, sr: 8, gain: 32, note: "fm" },
  { label: "Aviation", mhz: 124.0, sr: 8, gain: 40 },
  { label: "ADS-B avions", mhz: 1090, sr: 20, gain: 40, note: "bandes-a-explorer" },
  { label: "ISM 868", mhz: 868.3, sr: 4, gain: 40, note: "ism868" },
  { label: "2.4 GHz", mhz: 2440, sr: 20, gain: 40, note: "wifi24" },
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
  const [mhz, setMhz] = useState(100.2);
  const [sr, setSr] = useState(8);
  const [gain, setGain] = useState(32);
  const [listening, setListening] = useState(false);
  const audioRef = useRef<{ ctx: AudioContext; ws: WebSocket; next: number } | null>(null);

  // push tuning to the radio whenever a control changes
  useEffect(() => {
    tune(mhz, sr, gain);
  }, [mhz, sr, gain]);

  const stopAudio = () => {
    fetch("/api/audio?on=false", { method: "POST" }).catch(() => {});
    const a = audioRef.current;
    if (a) {
      a.ws.close();
      a.ctx.close().catch(() => {});
      audioRef.current = null;
    }
    setListening(false);
  };

  const startAudio = () => {
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
      const buf = ctx.createBuffer(1, i16.length, 48000);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 32768;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      const t = Math.max(st.next, ctx.currentTime + 0.05); // small lead to avoid underruns
      src.start(t);
      st.next = t + buf.duration;
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
        {/* frequency */}
        <section className="rounded-2xl border border-edge bg-panel p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Fréquence d'accord</div>
              <div className="font-display text-4xl font-extrabold tabular-nums">
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
            {listening ? "■ Arrêter l'écoute" : "🔊 Écouter (démodulation FM)"}
          </button>
          <p className="mt-1 text-xs text-muted">
            Idéal sur une station FM (88–108 MHz). Sans HackRF, une tonalité de test confirme l'audio.
          </p>
        </section>

        {/* spectrum + waterfall */}
        <section className="rounded-2xl border border-edge bg-panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Spectre</h3>
            <Readout frame={frame} />
          </div>
          <Spectrum frame={frame} />
        </section>
        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Waterfall</h3>
          <Waterfall frame={frame} />
        </section>
      </div>

      {/* side: presets, bandwidth, gain, help */}
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Bandes prêtes</h3>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setMhz(p.mhz); setSr(p.sr); setGain(p.gain); }}
                className="flex items-center justify-between rounded-lg border border-edge bg-ink px-3 py-2 text-left text-sm hover:border-phos"
              >
                <span>{p.label}</span>
                <span className="font-mono text-xs text-muted">{p.mhz} MHz</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Bande observée <span className="normal-case text-slate-500">(sample rate)</span>
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
          <p className="mt-2 text-xs text-muted">MSps — largeur observée ≈ {sr} MHz autour du centre.</p>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Gain</h3>
            <span className="font-mono text-sm">{gain} dB</span>
          </div>
          <input
            type="range" min={0} max={62} step={2} value={gain}
            onChange={(e) => setGain(parseInt(e.target.value))}
            className="w-full accent-phos"
          />
          <p className="mt-2 text-xs text-muted">
            Monte jusqu'à voir le signal ; redescends si tout le plancher monte (saturation).
          </p>
        </section>

        <section className="rounded-2xl border border-edge bg-panel p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Comprendre</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <HelpLink onLearn={onLearn} slug="fft-spectre" label="lire le spectre" />
            <HelpLink onLearn={onLearn} slug="waterfall" label="le waterfall" />
            <HelpLink onLearn={onLearn} slug="hackrf" label="le gain" />
            <HelpLink onLearn={onLearn} slug="modulations" label="les modulations" />
            <HelpLink onLearn={onLearn} slug="bandes-a-explorer" label="quoi écouter" />
          </div>
          {strongest && (
            <p className="mt-3 text-xs text-muted">
              Pic le plus fort : <b className="text-slate-200">{strongest.center_mhz.toFixed(2)} MHz</b>{" "}
              ({strongest.snr_db.toFixed(0)} dB SNR, {strongest.bandwidth_mhz.toFixed(2)} MHz de large).
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function Readout({ frame }: { frame: Frame | null }) {
  if (!frame) return <span className="font-mono text-xs text-muted">—</span>;
  return (
    <span className="flex gap-3 font-mono text-xs text-muted">
      <span>bruit <b className="text-slate-300">{frame.noise_floor_db.toFixed(0)}</b></span>
      <span>pic <b className="text-slate-300">{frame.peak_db.toFixed(0)}</b></span>
      <span>occ <b className="text-slate-300">{(frame.occupancy * 100).toFixed(0)}</b>%</span>
    </span>
  );
}

function HelpLink({ onLearn, slug, label }: { onLearn: (s: string) => void; slug: string; label: string }) {
  return (
    <button onClick={() => onLearn(slug)} className="rounded-full border border-edge px-3 py-1 text-xs text-phos hover:border-phos">
      {label}
    </button>
  );
}
