import { setMode } from "../lib/useSpectra";

const BANDS = [
  { mode: "sweep868", label: "868 ISM", icon: "📡" },
  { mode: "sweepfm", label: "FM", icon: "📻" },
  { mode: "sweep24", label: "2.4 GHz", icon: "📶" },
  { mode: "weather433", label: "Weather 433", icon: "🌡️" },
];

export default function Controls({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {BANDS.map((b) => {
        const on = active === b.mode;
        return (
          <button
            key={b.mode}
            onClick={() => setMode(b.mode)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              on
                ? "bg-accent text-ink shadow-lg shadow-accent/20"
                : "bg-edge text-slate-300 hover:bg-edge/70"
            }`}
          >
            {b.icon} {b.label}
          </button>
        );
      })}
    </div>
  );
}
