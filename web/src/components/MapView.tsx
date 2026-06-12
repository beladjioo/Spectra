import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Frame } from "../lib/useRf";
import { tune } from "../lib/useRf";
import { useI18n, STR, type LStr } from "../lib/i18n";
import Icon from "./Icon";

const WORLD_VIEW: [number, number] = [30, 5]; // a neutral world view until located

/** Typical reception ranges per band — pedagogy, not measurement. */
function ringsFor(centerMhz: number): { km: number; label: LStr; color: string }[] {
  const R = STR.map.rings;
  if (centerMhz >= 87 && centerMhz < 109) return [{ km: 70, label: R.fm, color: "#4af2c8" }];
  if (centerMhz >= 117 && centerMhz < 138) return [{ km: 150, label: R.air, color: "#7dd3fc" }];
  if (centerMhz >= 1080 && centerMhz < 1100) return [{ km: 370, label: R.adsb, color: "#7dd3fc" }];
  if ((centerMhz >= 430 && centerMhz < 435) || (centerMhz >= 863 && centerMhz < 873))
    return [{ km: 2, label: R.ism, color: "#ffb454" }];
  if (centerMhz >= 2400 && centerMhz < 2484)
    return [
      { km: 0.1, label: R.wifi, color: "#ffb454" },
      { km: 5, label: R.drone, color: "#fb7185" },
    ];
  return [{ km: 5, label: R.horizon, color: "#697a8c" }];
}

export default function MapView({ frame }: { frame: Frame | null }) {
  const { t } = useI18n();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const youRef = useRef<{ dot: L.CircleMarker; acc: L.Circle } | null>(null);
  const ringsRef = useRef<L.LayerGroup | null>(null);
  const planesRef = useRef<Map<string, L.Marker>>(new Map());
  const posRef = useRef<[number, number] | null>(null);
  const [located, setLocated] = useState<"no" | "pending" | "yes" | "denied">("no");

  /* map bootstrap */
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true, attributionControl: true, worldCopyJump: true }).setView(
      WORLD_VIEW,
      2,
    );
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
    ringsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // Leaflet needs a nudge when mounted in a fresh layout
    setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
      youRef.current = null;
      ringsRef.current = null;
      planesRef.current.clear();
    };
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocated("denied");
      return;
    }
    setLocated("pending");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
        posRef.current = pos;
        setLocated("yes");
        const map = mapRef.current;
        if (!map) return;
        if (!youRef.current) {
          const dot = L.circleMarker(pos, {
            radius: 7,
            color: "#4af2c8",
            fillColor: "#4af2c8",
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(map);
          dot.bindTooltip(t(STR.map.you));
          const acc = L.circle(pos, {
            radius: p.coords.accuracy,
            color: "#4af2c8",
            weight: 1,
            fillOpacity: 0.06,
            dashArray: "4 4",
          }).addTo(map);
          youRef.current = { dot, acc };
        } else {
          youRef.current.dot.setLatLng(pos);
          youRef.current.acc.setLatLng(pos).setRadius(p.coords.accuracy);
        }
        map.setView(pos, 10);
        // the simulator's traffic now orbits *you*
        import("../lib/simFrame").then(({ setSimOrigin }) => setSimOrigin(pos[0], pos[1]));
      },
      () => setLocated("denied"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  /* coverage rings follow the tuned band — only once we know where "here" is */
  const centerMhz = frame?.center_mhz ?? 0;
  useEffect(() => {
    const map = mapRef.current;
    const layer = ringsRef.current;
    if (!map || !layer || !centerMhz || !posRef.current) return;
    layer.clearLayers();
    for (const ring of ringsFor(centerMhz)) {
      const c = L.circle(posRef.current, {
        radius: ring.km * 1000,
        color: ring.color,
        weight: 1.5,
        opacity: 0.8,
        fillColor: ring.color,
        fillOpacity: 0.05,
      }).addTo(layer);
      c.bindTooltip(t(ring.label), { permanent: false });
    }
  }, [Math.round(centerMhz), located, t]); // eslint-disable-line

  /* aircraft markers track the live frames — shown once the user is located
     (so the demo traffic, which orbits the user, has a real place to be) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    const list = located === "yes" ? frame?.aircraft ?? [] : [];
    for (const a of list) {
      if (a.lat == null || a.lon == null) continue;
      seen.add(a.icao);
      // a small phosphor plane glyph, rotated to the aircraft's heading
      const html = `<svg viewBox="0 0 24 24" width="22" height="22" style="transform:rotate(${a.track_deg ?? 0}deg);filter:drop-shadow(0 0 4px rgba(125,211,252,.85))" fill="#7dd3fc"><path d="M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5V18l7.5-2v3L8 20.5V22l4-1 4 1v-1.5L13.5 19v-3L21 18v-2.5z"/></svg>`;
      const icon = L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
      const pop = `<b>${a.callsign ?? a.icao}</b><br/>${a.alt_ft != null ? a.alt_ft.toLocaleString() + " ft · " : ""}${
        a.speed_kt != null ? a.speed_kt.toFixed(0) + " kt" : ""
      }`;
      const existing = planesRef.current.get(a.icao);
      if (existing) {
        existing.setLatLng([a.lat, a.lon]);
        existing.setIcon(icon);
        existing.setPopupContent(pop);
      } else {
        const m = L.marker([a.lat, a.lon], { icon }).addTo(map).bindPopup(pop);
        planesRef.current.set(a.icao, m);
      }
    }
    for (const [icao, m] of planesRef.current) {
      if (!seen.has(icao)) {
        m.remove();
        planesRef.current.delete(icao);
      }
    }
  }, [frame?.aircraft, located]); // eslint-disable-line

  const nAircraft = located === "yes" ? (frame?.aircraft ?? []).filter((a) => a.lat != null).length : 0;
  const onAdsb = centerMhz >= 1080 && centerMhz < 1100;

  return (
    <div className="flex flex-col gap-4">
      <div className="rise flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-edge bg-panel p-5">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Icon name="map" size={20} className="text-phos" /> {t(STR.map.title)}
          </h2>
          <p className="mt-1 max-w-[64ch] text-sm text-muted">{t(STR.map.sub)}</p>
        </div>
        <button
          onClick={locate}
          disabled={located === "pending"}
          className="rounded-lg bg-phos px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {located === "pending" ? t(STR.map.locating) : t(STR.map.locate)}
        </button>
      </div>
      {located === "denied" && (
        <p className="rounded-xl border border-amber/40 bg-amber/5 px-4 py-2 text-xs text-amber">
          {t(STR.map.denied)}
        </p>
      )}

      <div className="crt rise overflow-hidden border border-edge/70" style={{ animationDelay: "80ms" }}>
        <div ref={divRef} className="h-[480px] w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>{t(STR.map.ringHint)}</span>
        {onAdsb ? (
          <span className="flex items-center gap-1.5 font-mono">
            <Icon name="plane" size={13} className="text-signal" />
            <b className="text-signal">{nAircraft}</b> {t(STR.map.aircraft)}
          </span>
        ) : (
          <button onClick={() => tune(1090, 8, 40)} className="text-phos underline-offset-2 hover:underline">
            {t(STR.map.tuneAdsb)}
          </button>
        )}
      </div>
    </div>
  );
}
