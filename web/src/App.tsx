import { useEffect, useRef, useState } from "react";
import SurveyMap, { type Pt } from "./components/SurveyMap";
import { setMode, useSpectra } from "./lib/useSpectra";

type Layer = "noise" | "lora";

function dist(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000, r = Math.PI / 180;
  const dla = (b.lat - a.lat) * r, dlo = (b.lon - a.lon) * r;
  const x = Math.sin(dla / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dlo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const inv = (v: number, bad: number, good: number) => clamp01((v - bad) / (good - bad));

export default function App() {
  const { connected, sweep, status, lora } = useSpectra();
  const sdr = status?.sdr;
  const [layer, setLayer] = useState<Layer>("noise");
  const [me, setMe] = useState<{ lat: number; lon: number; acc?: number } | null>(null);
  const [recording, setRecording] = useState(false);
  const [points, setPoints] = useState<Pt[]>([]);
  const lastPt = useRef<{ lat: number; lon: number } | null>(null);

  // target whatever sensor the agent reports (node name on the Pi box, not hardcoded)
  const sensor = status?.sensor_id ?? sweep?.sensor_id ?? "jetson-desktop";
  const pick = (l: Layer) => {
    setLayer(l);
    setPoints([]); lastPt.current = null;            // each layer = its own map
    setMode(l === "noise" ? "sweep868" : "lora_activity", sensor);
  };

  // record a point on each fresh measurement while recording + GPS fix
  const tick = layer === "noise" ? sweep?.ts : lora?.ts;
  useEffect(() => {
    if (!recording || !me) return;
    if (lastPt.current && dist(lastPt.current, me) < 8) return;
    let q: number, label: string;
    if (layer === "noise") {
      if (!sweep) return;
      q = inv(sweep.noise_floor_db, -55, -90); // quiet = good
      label = `bruit ${sweep.noise_floor_db} dB · occ ${(sweep.occupancy_ratio * 100).toFixed(0)}%`;
    } else {
      if (!lora) return;
      q = lora.bursts_per_min === 0 ? 0 : inv(lora.last_burst_db ?? -95, -90, -40); // strong = good
      label = `${lora.bursts_per_min} bursts/min · ${lora.last_burst_db ?? "—"} dB`;
    }
    lastPt.current = { ...me };
    setPoints((ps) => [...ps, { lat: me.lat, lon: me.lon, q, label, ts: Date.now() }]);
  }, [tick]); // eslint-disable-line

  const startGps = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée");
    navigator.geolocation.watchPosition(
      (g) => setMe({ lat: g.coords.latitude, lon: g.coords.longitude, acc: g.coords.accuracy }),
      (e) => alert("Position refusée : " + e.message + "\n(ouvre l'app en HTTPS — https://<ip>:30943 — pour autoriser le GPS)"),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  };

  const exportGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature", geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: { layer, quality: +p.q.toFixed(3), label: p.label, ts: new Date(p.ts).toISOString() },
      })),
    };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" }));
    a.download = `spectra-survey-${layer}.geojson`; a.click();
  };

  return (
    <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Spectra<span className="text-phos">.</span></h1>
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

      <div className={`flex items-center gap-4 rounded-2xl border p-4 ${sdr?.present ? "border-phos/30 bg-phos/5" : "border-rose-500/30 bg-rose-500/5"}`}>
        <div className="text-2xl">{sdr?.present ? "📡" : "🔌"}</div>
        <div>
          <div className="font-semibold">{sdr?.present ? "HackRF connecté ✓" : "Aucun SDR détecté"}</div>
          <div className="text-sm text-muted">
            {sdr?.present ? [sdr.board, sdr.serial && "série " + sdr.serial, sdr.firmware].filter(Boolean).join(" · ")
              : sdr?.detail || "Branche ton HackRF en USB sur ce laptop."}
          </div>
        </div>
      </div>

      {/* layer selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Mesurer :</span>
        <button onClick={() => pick("noise")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${layer === "noise" ? "bg-phos text-ink" : "border border-edge bg-panel text-slate-300 hover:border-phos"}`}>📈 Bruit 868</button>
        <button onClick={() => pick("lora")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${layer === "lora" ? "bg-phos text-ink" : "border border-edge bg-panel text-slate-300 hover:border-phos"}`}>📶 Activité LoRa</button>
        <span className="text-xs text-muted">
          {layer === "noise" ? "vert = calme (bonne réception)" : "vert = uplinks forts/nombreux (bonne couverture)"}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl border border-edge bg-panel">
          <div className="flex items-center justify-between border-b border-edge px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Carte de couverture · {layer === "noise" ? "bruit 868" : "activité LoRa"}</h2>
            <span className="font-mono text-xs text-muted">{points.length} points</span>
          </div>
          <SurveyMap me={me} points={points} />
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-edge bg-panel p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Mesure live</h2>
            {layer === "noise" ? (
              <div className="grid grid-cols-2 gap-3">
                <Stat l="Bruit de fond" v={sweep ? sweep.noise_floor_db.toFixed(0) : "—"} u="dB" />
                <Stat l="Occupation" v={sweep ? (sweep.occupancy_ratio * 100).toFixed(0) : "—"} u="%" />
                <div className="col-span-2 rounded-xl border border-edge bg-ink p-3">
                  <div className="text-[11px] uppercase text-muted">État</div>
                  <div className={`font-display text-xl font-bold ${sweep?.interference ? "text-rose-400" : "text-phos"}`}>
                    {sweep ? (sweep.interference ? "⚠️ Bruyant / interférence" : "✅ Calme") : "—"}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Stat l="Uplinks /min" v={lora ? String(lora.bursts_per_min) : "—"} />
                <Stat l="Dernier burst" v={lora?.last_burst_db != null ? lora.last_burst_db.toFixed(0) : "—"} u="dB" />
                <div className="col-span-2 rounded-xl border border-edge bg-ink p-3">
                  <div className="text-[11px] uppercase text-muted">Couverture LoRa ici</div>
                  <div className={`font-display text-xl font-bold ${lora && lora.bursts_per_min > 0 ? "text-phos" : "text-rose-400"}`}>
                    {!lora ? "—" : lora.bursts_per_min > 0 ? "✅ Uplinks captés" : "⚠️ Aucun uplink (zone morte ?)"}</div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-edge bg-panel p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Relevé terrain</h2>
            <button onClick={startGps} className={`mb-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold ${me ? "border-phos bg-phos text-ink" : "border-edge bg-edge text-slate-200 hover:border-phos"}`}>
              📍 {me ? `Position active · ±${Math.round(me.acc ?? 0)} m` : "Activer ma position"}</button>
            {me && (me.acc ?? 0) > 50 && (
              <div className="mb-2 text-xs text-amber">⚠️ Précision faible (±{Math.round(me.acc ?? 0)} m) — utilise un téléphone (vrai GPS) pour des points précis.</div>
            )}
            <button onClick={() => { if (!me) return alert("Active d'abord ta position 📍"); setRecording((r) => !r); }}
              className={`mb-2 w-full rounded-xl px-4 py-3 text-sm font-semibold ${recording ? "bg-rose-500 text-white" : "bg-phos text-ink"}`}>
              {recording ? "■ Arrêter le relevé" : "● Démarrer le relevé"}</button>
            <div className="flex gap-2">
              <button onClick={exportGeoJSON} className="flex-1 rounded-xl border border-edge px-3 py-2.5 text-sm hover:border-phos">⬇ GeoJSON</button>
              <button onClick={() => { setPoints([]); lastPt.current = null; }} className="flex-1 rounded-xl border border-edge px-3 py-2.5 text-sm hover:border-rose-400">Effacer</button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted">
              <span>Mauvais</span><div className="h-2.5 flex-1 rounded bg-gradient-to-r from-rose-500 via-yellow-300 to-phos" /><span>Bon</span>
            </div>
          </section>
        </div>
      </div>

      <footer className="pb-2 pt-1 text-center text-xs text-slate-600">
        Spectra · HackRF · réception seule · activité LoRa = détection de bursts (indicatif, pas de décodage DevAddr).
      </footer>
    </div>
  );
}

function Stat({ l, v, u }: { l: string; v: string; u?: string }) {
  return (
    <div className="rounded-xl border border-edge bg-ink p-3">
      <div className="text-[11px] uppercase text-muted">{l}</div>
      <div className="font-display text-2xl font-bold">{v}{u && <span className="ml-1 text-sm text-muted">{u}</span>}</div>
    </div>
  );
}
