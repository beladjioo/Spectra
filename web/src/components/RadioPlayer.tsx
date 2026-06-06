import { useRef, useState } from "react";
import { setMode } from "../lib/useSpectra";

const STATIONS = [
  { freq: "100.2", name: "Skyrock" },
  { freq: "96.9", name: "Chérie FM" },
  { freq: "106.1", name: "NRJ" },
  { freq: "91.8", name: "Fun Radio" },
  { freq: "89.1", name: "France Inter" },
  { freq: "105.1", name: "France Info" },
];

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const play = async (freq: string, name: string) => {
    setCurrent(name);
    await setMode(`listenfm:${freq}`);
    // give the agent a moment to retune, then (re)connect the stream
    setTimeout(() => {
      const a = audioRef.current;
      if (a) {
        a.src = `/audio/fm.mp3?t=${Date.now()}`;
        a.play().catch(() => {});
      }
    }, 2500);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {STATIONS.map((s) => (
          <button
            key={s.freq}
            onClick={() => play(s.freq, s.name)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              current === s.name
                ? "bg-emerald-500 text-ink"
                : "bg-edge text-slate-300 hover:bg-edge/70"
            }`}
          >
            {s.name} <span className="text-xs opacity-70">{s.freq}</span>
          </button>
        ))}
      </div>
      <audio ref={audioRef} controls preload="none" className="w-full max-w-md" />
      {current && (
        <div className="text-xs text-slate-400">
          ▶ {current} — si pas de son, appuie sur play (~2 s de retune)
        </div>
      )}
    </div>
  );
}
