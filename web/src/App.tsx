import Controls from "./components/Controls";
import ObjectsFeed from "./components/ObjectsFeed";
import RadioPlayer from "./components/RadioPlayer";
import Waterfall from "./components/Waterfall";
import { useSpectra } from "./lib/useSpectra";

function Card({ title, right, children, className = "" }: any) {
  return (
    <section className={`rounded-xl border border-edge bg-panel p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-ink/60 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-100">
        {value}
        {unit && <span className="ml-1 text-sm text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

export default function App() {
  const { connected, sweep, status, devices } = useSpectra();
  const nf = sweep ? sweep.noise_floor_db.toFixed(1) : "—";
  const occ = sweep ? (sweep.occupancy_ratio * 100).toFixed(0) : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Spectra <span className="text-accent">·</span>{" "}
            <span className="text-base font-normal text-slate-400">RF &amp; IoT Observability</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-panel px-4 py-2 text-right">
            <div className="text-xs uppercase text-slate-500">Active mode</div>
            <div className="font-semibold text-accent">{status?.band_label ?? "—"}</div>
          </div>
          <span
            className={`flex items-center gap-2 text-sm ${
              connected ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-400" : "bg-rose-400"
              } ${connected ? "animate-pulse" : ""}`}
            />
            {connected ? "live" : "reconnecting"}
          </span>
        </div>
      </header>

      {/* mode controls */}
      <Card title="Radio — select a band">
        <Controls active={status?.mode} />
      </Card>

      {/* spectrum + stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Waterfall — live spectrum"
          className="lg:col-span-2"
          right={<span className="text-xs text-slate-500">{sweep?.band_label}</span>}
        >
          <Waterfall sweep={sweep} />
        </Card>
        <Card title="Now">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Noise floor" value={nf} unit="dB" />
            <Stat label="Occupancy" value={occ} unit="%" />
            <Stat label="Peak" value={sweep ? sweep.peak_db.toFixed(1) : "—"} unit="dB" />
            <Stat label="Interference" value={sweep?.interference ? "⚠️" : "ok"} />
          </div>
        </Card>
      </div>

      {/* radio + objects */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="📻 FM Radio — live audio">
          <RadioPlayer />
        </Card>
        <Card title="🛰️ Detected objects">
          <ObjectsFeed devices={devices} />
        </Card>
      </div>

      <footer className="pt-2 text-center text-xs text-slate-600">
        Spectra — GitOps · HackRF · k3s. Ops console in Grafana.
      </footer>
    </div>
  );
}
