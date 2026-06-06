import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

export type Pt = {
  lat: number;
  lon: number;
  nf: number; // noise_floor_db
  occ: number;
  interference: boolean;
  ts: number;
};

const DARK_STYLE: any = {
  version: 8,
  sources: {
    c: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap © CARTO",
    },
  },
  layers: [{ id: "c", type: "raster", source: "c" }],
};

export default function SurveyMap({ me, points }: { me: { lat: number; lon: number } | null; points: Pt[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const meRef = useRef<maplibregl.Marker | null>(null);
  const centered = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: DARK_STYLE,
      center: [3.901, 43.567], // Lattes/Montpellier
      zoom: 12,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      map.addSource("pts", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "pts",
        type: "circle",
        source: "pts",
        paint: {
          "circle-radius": 7,
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(0,0,0,.4)",
          "circle-color": [
            "interpolate", ["linear"], ["get", "nf"],
            -90, "#4af2c8", -72, "#ffe14a", -55, "#ff5d5d",
          ],
        },
      });
    });
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("pts") as maplibregl.GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: { nf: p.nf, occ: p.occ, interference: p.interference },
      })),
    });
  }, [points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !me) return;
    if (!meRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:16px;height:16px;border-radius:50%;background:#4af2c8;border:2px solid #06090e;box-shadow:0 0 0 6px rgba(74,242,200,.22),0 0 14px rgba(74,242,200,.8)";
      meRef.current = new maplibregl.Marker({ element: el }).setLngLat([me.lon, me.lat]).addTo(map);
    } else {
      meRef.current.setLngLat([me.lon, me.lat]);
    }
    if (!centered.current) {
      map.flyTo({ center: [me.lon, me.lat], zoom: 14 });
      centered.current = true;
    }
  }, [me]);

  return <div ref={ref} className="h-[560px] w-full" />;
}
