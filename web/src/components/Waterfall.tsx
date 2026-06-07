import { useEffect, useRef } from "react";
import type { Frame } from "../lib/useRf";

const WF_W = 512;
const WF_H = 180;

/** Map a 0..1 magnitude to a dark→teal→amber→white colormap. */
function color(t: number): string {
  const stops: [number, [number, number, number]][] = [
    [0.0, [6, 9, 14]],
    [0.4, [16, 70, 70]],
    [0.65, [74, 242, 200]],
    [0.85, [255, 180, 84]],
    [1.0, [255, 255, 255]],
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const f = (t - a[0]) / (b[0] - a[0] || 1);
  const c = (i: number) => Math.round(a[1][i] + (b[1][i] - a[1][i]) * f);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

/** Time-axis waterfall: each new frame scrolls down and paints a row on top. */
export default function Waterfall({ frame }: { frame: Frame | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !frame || !frame.bins.length) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    // scroll the existing image down by one pixel row
    const prev = ctx.getImageData(0, 0, WF_W, WF_H - 1);
    ctx.putImageData(prev, 0, 1);

    // paint the newest frame as the top row
    const bins = frame.bins;
    const min = frame.noise_floor_db - 2;
    const max = Math.max(frame.peak_db, frame.noise_floor_db + 8) + 2;
    for (let px = 0; px < WF_W; px++) {
      const i = Math.floor((px / WF_W) * bins.length);
      const t = Math.max(0, Math.min(1, (bins[i] - min) / (max - min)));
      ctx.fillStyle = color(t);
      ctx.fillRect(px, 0, 1, 1);
    }
  }, [frame?.ts]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={ref}
      width={WF_W}
      height={WF_H}
      className="h-[180px] w-full rounded-lg"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
