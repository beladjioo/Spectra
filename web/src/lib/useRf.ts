import { useEffect, useRef, useState } from "react";

export type Peak = {
  center_mhz: number;
  bandwidth_mhz: number;
  power_db: number;
  snr_db: number;
  wideband: boolean;
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
  ts: number;
};

/** Subscribes to the backend WebSocket and exposes the latest spectrum frame. */
export function useRf() {
  const [connected, setConnected] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    const connect = () => {
      if (stop) return;
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!stop) setTimeout(connect, 1500);
      };
      ws.onmessage = (e) => setFrame(JSON.parse(e.data) as Frame);
    };
    connect();
    return () => {
      stop = true;
      wsRef.current?.close();
    };
  }, []);

  return { connected, frame };
}

/** Retune the radio (each mission tunes to its band). */
export async function tune(center_mhz: number, sample_rate_msps?: number, gain_db?: number) {
  try {
    await fetch("/api/tune", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ center_mhz, sample_rate_msps, gain_db }),
    });
  } catch {
    /* backend may be momentarily down; the WS reconnect loop covers UX */
  }
}
