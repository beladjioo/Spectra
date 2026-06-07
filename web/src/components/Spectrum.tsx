import { useEffect, useRef } from "react";
import type { Frame } from "../lib/useRf";

/** Live power spectrum for the tuned band, with detected peaks highlighted. */
export default function Spectrum({ frame }: { frame: Frame | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = (cv.width = cv.clientWidth * devicePixelRatio);
    const H = (cv.height = cv.clientHeight * devicePixelRatio);
    ctx.clearRect(0, 0, W, H);

    if (!frame || !frame.bins.length) {
      ctx.fillStyle = "#697a8c";
      ctx.font = `${12 * devicePixelRatio}px "IBM Plex Mono", monospace`;
      ctx.fillText("en attente du flux…", 12 * devicePixelRatio, H / 2);
      return;
    }

    const bins = frame.bins;
    const lo = frame.center_mhz - frame.span_mhz / 2;
    const hi = frame.center_mhz + frame.span_mhz / 2;
    const min = frame.noise_floor_db - 4;
    const max = Math.max(frame.peak_db, frame.noise_floor_db + 10) + 4;
    const x = (mhz: number) => ((mhz - lo) / (hi - lo)) * W;
    const y = (db: number) => H - ((db - min) / (max - min)) * H;

    // detected peaks shaded (wideband = amber, narrow = phos)
    for (const p of frame.peaks) {
      const x0 = x(p.center_mhz - p.bandwidth_mhz / 2);
      const x1 = x(p.center_mhz + p.bandwidth_mhz / 2);
      ctx.fillStyle = p.wideband ? "rgba(255,180,84,.16)" : "rgba(74,242,200,.14)";
      ctx.fillRect(x0, 0, Math.max(x1 - x0, 1.5 * devicePixelRatio), H);
    }

    // noise floor line
    ctx.strokeStyle = "rgba(105,122,140,.5)";
    ctx.setLineDash([4 * devicePixelRatio, 4 * devicePixelRatio]);
    ctx.beginPath();
    ctx.moveTo(0, y(frame.noise_floor_db));
    ctx.lineTo(W, y(frame.noise_floor_db));
    ctx.stroke();
    ctx.setLineDash([]);

    // spectrum trace + fill
    ctx.beginPath();
    bins.forEach((db, i) => {
      const px = (i / (bins.length - 1)) * W;
      const py = y(db);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "#4af2c8";
    ctx.lineWidth = 1.5 * devicePixelRatio;
    ctx.stroke();
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = "rgba(74,242,200,.07)";
    ctx.fill();

    // axis labels (center frequency)
    ctx.fillStyle = "#697a8c";
    ctx.font = `${11 * devicePixelRatio}px "IBM Plex Mono", monospace`;
    ctx.fillText(`${lo.toFixed(1)}`, 4 * devicePixelRatio, H - 4 * devicePixelRatio);
    const cl = `${frame.center_mhz.toFixed(1)} MHz`;
    ctx.fillText(cl, W / 2 - ctx.measureText(cl).width / 2, H - 4 * devicePixelRatio);
    const hl = `${hi.toFixed(1)}`;
    ctx.fillText(hl, W - ctx.measureText(hl).width - 4 * devicePixelRatio, H - 4 * devicePixelRatio);
  }, [frame]);

  return <canvas ref={ref} className="h-[200px] w-full" />;
}
