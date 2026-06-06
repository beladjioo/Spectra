import { useEffect, useRef, useState } from "react";

export type Bin = { freq_mhz: number; power_db: number };
export type Sweep = {
  sensor_id: string;
  band_mhz: [number, number];
  band_label?: string;
  noise_floor_db: number;
  peak_db: number;
  occupancy_ratio: number;
  interference: boolean;
  bins: Bin[];
  ts: number;
};
export type Sdr = { present: boolean; board?: string; serial?: string; firmware?: string; detail?: string };
export type Status = {
  sensor_id: string;
  mode: string;
  band_label: string;
  center_mhz: number;
  sdr?: Sdr;
  ts: number;
};
export type DeviceEvent = { sensor_id: string; kind: string; decode: any; ts: number };

type Msg = { topic: string; kind: "sweep" | "devices" | "status"; data: any };

/** Subscribes to the gateway WebSocket and exposes the live RF state. */
export function useSpectra() {
  const [connected, setConnected] = useState(false);
  const [sweep, setSweep] = useState<Sweep | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [devices, setDevices] = useState<DeviceEvent[]>([]);
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
        if (!stop) setTimeout(connect, 2000);
      };
      ws.onmessage = (e) => {
        const m: Msg = JSON.parse(e.data);
        if (m.kind === "sweep") setSweep(m.data);
        else if (m.kind === "status") setStatus(m.data);
        else if (m.kind === "devices")
          setDevices((d) => [{ ...m.data }, ...d].slice(0, 100));
      };
    };
    connect();
    return () => {
      stop = true;
      wsRef.current?.close();
    };
  }, []);

  return { connected, sweep, status, devices };
}

export async function setMode(mode: string, sensor = "jetson-desktop") {
  await fetch(`/api/mode?sensor=${encodeURIComponent(sensor)}&mode=${encodeURIComponent(mode)}`, {
    method: "POST",
  });
}
