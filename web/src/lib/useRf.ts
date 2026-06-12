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

/** Subscribes to the best available signal source and exposes the latest
 *  spectrum frame. Priority: WebUSB SDR (plugged into *this* computer) >
 *  backend WebSocket (the appliance) > in-browser simulator (static site,
 *  no hardware). The lower sources keep running quietly underneath and take
 *  over again the moment the USB radio goes away. */
export function useRf() {
  const [connected, setConnected] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let stop = false;
    let simTimer: number | null = null;
    let usb = false;

    const startSim = async () => {
      if (stop || simTimer != null || usb) return;
      const { simFrame } = await import("./simFrame");
      if (stop || simTimer != null || usb) return;
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
        if (!usb) {
          stopSim();
          setConnected(true);
        }
      };
      ws.onclose = () => {
        if (stop) return;
        startSim(); // browser-side fallback while the backend is away
        setTimeout(connect, simTimer != null || usb ? 10_000 : 1500);
      };
      ws.onmessage = (e) => {
        if (usb) return; // a directly-plugged SDR outranks the backend
        if (simTimer != null) stopSim();
        setFrame(JSON.parse(e.data) as Frame);
      };
    };

    const onUsbFrame = (e: Event) => {
      if (stop) return;
      setFrame((e as CustomEvent<Frame>).detail);
      setConnected(true);
    };
    const onUsbState = (e: Event) => {
      usb = (e as CustomEvent<{ active: boolean }>).detail.active;
      if (usb) stopSim();
      else if (wsRef.current?.readyState !== WebSocket.OPEN) startSim();
    };
    window.addEventListener("rfa-usb-frame", onUsbFrame);
    window.addEventListener("rfa-usb", onUsbState);

    connect();
    return () => {
      stop = true;
      stopSim();
      wsRef.current?.close();
      window.removeEventListener("rfa-usb-frame", onUsbFrame);
      window.removeEventListener("rfa-usb", onUsbState);
    };
  }, []);

  return { connected, frame };
}

/** Retune the radio (each mission tunes to its band). Drives whichever
 *  source is active: WebUSB SDR, backend, and the browser simulator. */
export async function tune(center_mhz: number, sample_rate_msps?: number, gain_db?: number) {
  import("./webusb").then(({ usbActive, usbTune }) => {
    if (usbActive()) usbTune(center_mhz, sample_rate_msps, gain_db);
  });
  import("./simFrame").then(({ simTune }) => simTune(center_mhz, sample_rate_msps, gain_db));
  try {
    await fetch("/api/tune", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ center_mhz, sample_rate_msps, gain_db }),
    });
  } catch {
    /* no backend — a client-side source already handled it */
  }
}
