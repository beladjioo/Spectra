import { useEffect, useRef, useState } from "react";

export type Peak = {
  center_mhz: number;
  bandwidth_mhz: number;
  power_db: number;
  snr_db: number;
  wideband: boolean;
};

/** One ADS-B aircraft track decoded by the backend (1090 MHz). */
export type Aircraft = {
  icao: string;
  callsign: string | null;
  alt_ft: number | null;
  speed_kt: number | null;
  track_deg: number | null;
  vrate_fpm: number | null;
  lat: number | null;
  lon: number | null;
  msgs: number;
  age_s: number;
};

/** One analysed spectrum frame from the Rust backend (WS /ws). */
export type Frame = {
  center_mhz: number;
  span_mhz: number;
  sample_rate_msps: number;
  gain_db: number;
  noise_floor_db: number;
  peak_db: number;
  occupancy: number;
  peaks: Peak[];
  drone_suspected: boolean;
  bins: number[];
  sim: boolean;
  sdr: { present: boolean; driver: string; label: string; serial: string };
  audio_rate: number;
  aircraft: Aircraft[];
  ts: number;
};

/** Subscribes to the backend WebSocket and exposes the latest spectrum frame.
 *  If no backend is reachable (the static Cloudflare Pages deployment), an
 *  in-browser simulator takes over so the whole app still works — and it
 *  keeps retrying the backend quietly in case one appears. */
export function useRf() {
  const [connected, setConnected] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    let simTimer: number | null = null;

    const startSim = async () => {
      if (stop || simTimer != null) return;
      const { simFrame } = await import("./simFrame");
      if (stop || simTimer != null) return;
      setConnected(true);
      simTimer = window.setInterval(() => setFrame(simFrame()), 125);
    };
    const stopSim = () => {
      if (simTimer != null) {
        clearInterval(simTimer);
        simTimer = null;
      }
    };

    const connect = () => {
      if (stop) return;
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => {
        stopSim();
        setConnected(true);
      };
      ws.onclose = () => {
        if (stop) return;
        startSim(); // browser-side fallback while the backend is away
        setTimeout(connect, simTimer != null ? 10_000 : 1500);
      };
      ws.onmessage = (e) => {
        if (simTimer != null) stopSim();
        setFrame(JSON.parse(e.data) as Frame);
      };
    };
    connect();
    return () => {
      stop = true;
      stopSim();
      wsRef.current?.close();
    };
  }, []);

  return { connected, frame };
}

/** Retune the radio (each mission tunes to its band). Drives both the real
 *  backend and the in-browser simulator, whichever is active. */
export async function tune(center_mhz: number, sample_rate_msps?: number, gain_db?: number) {
  import("./simFrame").then(({ simTune }) => simTune(center_mhz, sample_rate_msps, gain_db));
  try {
    await fetch("/api/tune", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ center_mhz, sample_rate_msps, gain_db }),
    });
  } catch {
    /* no backend — the browser simulator already handled it */
  }
}
