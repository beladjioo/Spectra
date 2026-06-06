import { useEffect, useRef } from "react";
import type { Sweep } from "../lib/useSpectra";

// simple turbo-ish colormap: power(dB) in [min,max] -> rgb
function color(db: number, min: number, max: number): [number, number, number] {
  let t = (db - min) / (max - min);
  t = Math.max(0, Math.min(1, t));
  // blue -> cyan -> green -> yellow -> red
  const stops: [number, number[]][] = [
    [0.0, [12, 16, 60]],
    [0.25, [0, 120, 200]],
    [0.5, [0, 200, 120]],
    [0.75, [230, 210, 40]],
    [1.0, [230, 60, 40]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (t >= a && t <= b) {
      const f = (t - a) / (b - a);
      return [
        Math.round(ca[0] + f * (cb[0] - ca[0])),
        Math.round(ca[1] + f * (cb[1] - ca[1])),
        Math.round(ca[2] + f * (cb[2] - ca[2])),
      ];
    }
  }
  return [230, 60, 40];
}

const MIN_DB = -95;
const MAX_DB = -35;
const ROWS = 240;

export default function Waterfall({ sweep }: { sweep: Sweep | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTs = useRef(0);

  useEffect(() => {
    if (!sweep || !sweep.bins?.length) return;
    if (sweep.ts === lastTs.current) return;
    lastTs.current = sweep.ts;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // scroll existing image up by one row
    const img = ctx.getImageData(0, 1, w, h - 1);
    ctx.putImageData(img, 0, 0);

    // draw the newest sweep on the bottom row
    const bins = [...sweep.bins].sort((a, b) => a.freq_mhz - b.freq_mhz);
    const n = bins.length;
    const row = ctx.createImageData(w, 1);
    for (let x = 0; x < w; x++) {
      const bi = Math.min(n - 1, Math.floor((x / w) * n));
      const [r, g, b] = color(bins[bi].power_db, MIN_DB, MAX_DB);
      const o = x * 4;
      row.data[o] = r;
      row.data[o + 1] = g;
      row.data[o + 2] = b;
      row.data[o + 3] = 255;
    }
    ctx.putImageData(row, 0, h - 1);
  }, [sweep]);

  const lo = sweep?.band_mhz?.[0];
  const hi = sweep?.band_mhz?.[1];

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={900}
        height={ROWS}
        className="w-full rounded-lg bg-ink"
        style={{ imageRendering: "pixelated", height: 260 }}
      />
      {lo != null && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1 text-xs text-slate-400">
          <span>{lo} MHz</span>
          <span>{hi} MHz</span>
        </div>
      )}
    </div>
  );
}
