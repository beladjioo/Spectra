import { useEffect, useRef, useState } from "react";
import SurveyMap, { type Pt } from "./components/SurveyMap";
import { useSpectra } from "./lib/useSpectra";

function dist(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000, r = Math.PI / 180;
  const dla = (b.lat - a.lat) * r, dlo = (b.lon - a.lon) * r;
  const x = Math.sin(dla / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function Spectrum({ bins }: { bins?: { freq_mhz: number; power_db: number }[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = (c.width = c.clientWidth * 2), H = (c.height = 160);
    ctx.clearRect(0, 0, W, H);
    if (!bins?.length) return;
    const b = [...bins].sort((x, y) => x.freq_mhz - y.freq_mhz);
    const min = -95, max = -30;
    ctx.beginPath();
    b.forEach((bin, i) => {
      const x = (i / (b.length - 1)) * W;
      const t = Math.max(0, Math.min(1, (bin.power_db - min) / (max - min)));
      const y = H - t * H;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.strokeStyle = "#4af2c8"; ctx.lineWidth = 2; ctx.stroke();
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = "rgba(74,242,200,.12)"; ctx.fill();
  }, [bins]);
  return <canvas ref={ref} className="h-[80px] w-full rounded-lg bg-ink" />;
}

export default function App() {
  const { connected, sweep, status } = useSpectra();
  const sdr = status?.sdr;
  const [me, setMe] = useState<{ lat: number; lon: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [points, setPoints] = useState<Pt[]>([]);
  const lastPt = useRef<{ lat: number; lon: number } | null>(null);

  // record a survey point on each fresh sweep while recording + we have a GPS fix
  useEffect(() => {
    if (!recording || !me || !sweep) return;
    if (lastPt.current && dist(lastPt.current, me) < 8) return; // dedupe by distance
    lastPt.current = { ...me };
    setPoints((ps) => [
      ...ps,
      { lat: me.lat, lon: me.lon, nf: sweep.noise_floor_db, occ: sweep.occupancy_ratio, interference: sweep.interference, ts: Date.now() },
    ]);
  }, [sweep, recording, me]);

  const startGps = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée");
    navigator.geolocation.watchPosition(
      (g) => setMe({ lat: g.coords.latitude, lon: g.coords.longitude }),
      (e) => alert("Position refusée : " + e.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
  };

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: { noise_floor_db: p.nf, occupancy: p.occ, interference: p.interference, ts: new Date(p.ts).toISOString() },
      })),
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" }));
    a.download = "spectra-survey.geojson"; a.click();
  };

  const nf = sweep ? sweep.noise_floor_db.toFixed(0) : "—";
  const occ = sweep ? (sweep.occupancy_ratio * 100).toFixed(0) : "—";

  return (
    <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-4 p-4 md:p-6">
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            Spectra<span className="text-phos">.</span>
          </h1>
          <span className="text-sm text-muted">Survey de couverture LoRa · 868 MHz</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-phos" : "bg-rose-500"}`} />
            {connected ? "en direct" : "hors-ligne"}
          </span>
          <span className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-muted">🛡️ <b className="text-slate-200">Passif</b> · écoute seule</span>
        </div>
      </header>

      {/* SDR banner */}
      <div className={`flex items-center gap-4 rounded-2xl border p-4 ${sdr?.present ? "border-phos/30 bg-phos/5" : "border-rose-500/30 bg-rose-500/5"}`}>
        <div className="text-2xl">{sdr?.present ? "📡" : "🔌"}</div>
        <div>
          <div className="font-semibold">{sdr?.present ? "HackRF connecté ✓" : "Aucun SDR détecté"}</div>
          <div className="text-sm text-muted">
            {sdr?.present
              ? [sdr.board, sdr.serial && "série " + sdr.serial, sdr.firmware].filter(Boolean).join(" · ")
              : sdr?.detail || "Branche ton HackRF en USB sur ce laptop."}
          </div>
        </div>
      </div>

      <p className="border-l-2 border-phos pl-3 text-sm leading-relaxed text-muted">
        Déplace-toi dans la commune et lance le relevé. Spectra cartographie le <b>bruit radio 868 MHz</b> :
        zones <b className="text-phos">vertes</b> = calmes (la gateway capte bien), <b className="text-rose-400">rouges</b> = bruitées.
        Repère les zones mortes et le meilleur emplacement de gateway.
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl border border-edge bg-panel">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Carte de couverture</h2>
            <span className="font-mono text-xs text-muted">{points.length} points</span>
          </div>
          <SurveyMap me={me} points={points} />
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-edge bg-panel p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Mesure live · 868 MHz</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-edge bg-ink p-3">
                <div className="text-[11px] uppercase text-muted">Bruit de fond</div>
                <div className="font-display text-2xl font-bold">{nf}<span className="ml-1 text-sm text-muted">dB</span></div>
              </div>
              <div className="rounded-xl border border-edge bg-ink p-3">
                <div className="text-[11px] uppercase text-muted">Occupation</div>
                <div className="font-display text-2xl font-bold">{occ}<span className="ml-1 text-sm text-muted">%</span></div>
              </div>
              <div className="col-span-2 rounded-xl border border-edge bg-ink p-3">
                <div className="text-[11px] uppercase text-muted">État</div>
                <div className={`font-display text-xl font-bold ${sweep?.interference ? "text-rose-400" : "text-phos"}`}>
                  {sweep ? (sweep.interference ? "⚠️ Bruyant / interférence" : "✅ Calme") : "—"}
                </div>
              </div>
            </div>
            <div className="mt-3"><Spectrum bins={sweep?.bins} /></div>
          </section>

          <section className="rounded-2xl border border-edge bg-panel p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Relevé terrain</h2>
            <button onClick={startGps} className={`mb-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold ${me ? "border-phos bg-phos text-ink" : "border-edge bg-edge text-slate-200 hover:border-phos"}`}>
              📍 {me ? "Position active" : "Activer ma position"}
            </button>
            <button onClick={() => { if (!me) return alert("Active d'abord ta position 📍"); setRecording((r) => !r); }}
              className={`mb-2 w-full rounded-xl px-4 py-3 text-sm font-semibold ${recording ? "bg-rose-500 text-white" : "bg-phos text-ink"}`}>
              {recording ? "■ Arrêter le relevé" : "● Démarrer le relevé"}
            </button>
            <div className="flex gap-2">
              <button onClick={exportGeoJSON} className="flex-1 rounded-xl border border-edge px-3 py-2.5 text-sm hover:border-phos">⬇ GeoJSON</button>
              <button onClick={() => { setPoints([]); lastPt.current = null; }} className="flex-1 rounded-xl border border-edge px-3 py-2.5 text-sm hover:border-rose-400">Effacer</button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span>Calme</span>
              <div className="h-2.5 flex-1 rounded bg-gradient-to-r from-phos via-yellow-300 to-rose-500" />
              <span>Bruyant</span>
            </div>
          </section>
        </div>
      </div>

      <footer className="pb-2 pt-1 text-center text-xs text-slate-600">
        Spectra · HackRF · réception seule · mesure indicative (HackRF moins sensible qu'un concentrateur LoRa).
      </footer>
    </div>
  );
}
