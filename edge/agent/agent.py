#!/usr/bin/env python3
"""Spectra edge agent v2 — mode supervisor.

A single HackRF can only listen to one band at a time, so the agent runs ONE
"mode" at a time and switches on command:

  - sweep   : hackrf_sweep across the ISM band -> spectra/<sensor>/sweep
  - weather : rtl_433 @433.92 MHz decoding sensors -> spectra/<sensor>/devices
  - (adsb)  : added in a later phase

The desired mode is read from a retained MQTT message on spectra/<sensor>/mode
(published by the spectra-control service, which the Grafana buttons call). On a
mode change the agent stops the current worker (releasing the HackRF) and starts
the new one. It publishes its active mode on spectra/<sensor>/status (retained)
so the UI can show what's running.

Everything is receive-only. Nothing is transmitted.
"""
from __future__ import annotations

import json
import logging
import os
import signal
import subprocess
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable

import paho.mqtt.client as mqtt
import yaml

log = logging.getLogger("spectra.agent")


# --------------------------------------------------------------------------- #
# Config
# --------------------------------------------------------------------------- #
@dataclass
class Config:
    sensor_id: str = "sensor-unknown"
    mqtt_host: str = "mosquitto.spectra.svc"
    mqtt_port: int = 1883
    mqtt_tls: bool = False
    topic_prefix: str = "spectra"
    default_mode: str = "sweep"
    # sweep params
    sweep_freq_min_mhz: int = 863
    sweep_freq_max_mhz: int = 870
    sweep_bin_width_hz: int = 100_000
    sweep_lna_gain: int = 32
    sweep_vga_gain: int = 20
    sweep_interval_s: float = 5.0
    noise_floor_dbm_threshold: float = -65.0
    # weather (rtl_433) params
    weather_device: str = "soapy:driver=hackrf"
    weather_frequency: str = "433.92M"
    weather_sample_rate: str = "250k"

    @classmethod
    def load(cls, path: str) -> "Config":
        raw: dict[str, Any] = {}
        if os.path.exists(path):
            with open(path) as fh:
                raw = yaml.safe_load(fh) or {}
        raw.setdefault("sensor_id", os.environ.get("SPECTRA_SENSOR_ID", "sensor-unknown"))
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        return cls(**{k: v for k, v in raw.items() if k in known})


# --------------------------------------------------------------------------- #
# Workers — each owns the HackRF while its mode is active
# --------------------------------------------------------------------------- #
class Worker:
    """Base worker: runs a subprocess and a reader thread until stopped."""

    name = "base"

    def __init__(self, cfg: Config, publish: Callable[[str, dict[str, Any]], None]):
        self.cfg = cfg
        self.publish = publish
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name=self.name, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=8)

    def _run(self) -> None:  # pragma: no cover - overridden
        raise NotImplementedError


class SweepWorker(Worker):
    name = "sweep"

    def _run(self) -> None:
        while not self._stop.is_set():
            started = time.time()
            try:
                self._one_sweep()
            except FileNotFoundError:
                log.error("hackrf_sweep not found"); self._stop.wait(30)
            except Exception:  # noqa: BLE001 - keep the edge loop alive
                log.exception("sweep failed")
            self._stop.wait(max(0.0, self.cfg.sweep_interval_s - (time.time() - started)))

    def _one_sweep(self) -> None:
        cmd = [
            "hackrf_sweep",
            "-f", f"{self.cfg.sweep_freq_min_mhz}:{self.cfg.sweep_freq_max_mhz}",
            "-w", str(self.cfg.sweep_bin_width_hz),
            "-l", str(self.cfg.sweep_lna_gain),
            "-g", str(self.cfg.sweep_vga_gain),
            "-1",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        bins: list[dict[str, float]] = []
        powers: list[float] = []
        for line in proc.stdout.splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 7:
                continue
            try:
                hz_low = float(parts[2]); hz_bw = float(parts[4])
                dbs = [float(p) for p in parts[6:]]
            except ValueError:
                continue
            for i, db in enumerate(dbs):
                freq = hz_low + (i + 0.5) * hz_bw
                bins.append({"freq_mhz": round(freq / 1e6, 4), "power_db": db})
                powers.append(db)
        if not powers:
            return
        ps = sorted(powers)
        noise_floor = ps[len(ps) // 10]
        occupied = sum(1 for p in powers if p > self.cfg.noise_floor_dbm_threshold)
        self.publish("sweep", {
            "band_mhz": [self.cfg.sweep_freq_min_mhz, self.cfg.sweep_freq_max_mhz],
            "noise_floor_db": round(noise_floor, 2),
            "peak_db": round(ps[-1], 2),
            "occupancy_ratio": round(occupied / len(powers), 4),
            "interference": noise_floor > self.cfg.noise_floor_dbm_threshold,
            "bins": bins,
        })


class WeatherWorker(Worker):
    """rtl_433: decodes weather stations and 433/868 sensors at a given frequency."""

    name = "weather"

    def __init__(self, cfg: Config, publish: Callable[[str, dict[str, Any]], None],
                 frequency: str | None = None, band_mhz: float | None = None):
        super().__init__(cfg, publish)
        self.frequency = frequency or cfg.weather_frequency
        self.band_mhz = band_mhz if band_mhz is not None else 433.92

    def _run(self) -> None:
        cmd = [
            "rtl_433",
            "-d", self.cfg.weather_device,
            "-f", self.frequency,
            "-s", self.cfg.weather_sample_rate,
            "-F", "json", "-M", "level",
        ]
        while not self._stop.is_set():
            try:
                log.info("starting rtl_433: %s", " ".join(cmd))
                proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
                assert proc.stdout is not None
                for line in proc.stdout:
                    if self._stop.is_set():
                        break
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    self.publish("devices", {"kind": "weather", "band_mhz": self.band_mhz,
                                             "decode": event})
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
            except FileNotFoundError:
                log.error("rtl_433 not found"); self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("rtl_433 failed; retry in 5s"); self._stop.wait(5)


# mode name -> factory(cfg, publish) -> Worker. Add new bands/decoders here.
WORKERS: dict[str, Callable[[Config, Callable[[str, dict[str, Any]], None]], Worker]] = {
    "sweep": lambda c, p: SweepWorker(c, p),
    "weather433": lambda c, p: WeatherWorker(c, p, "433.92M", 433.92),
    "weather868": lambda c, p: WeatherWorker(c, p, "868.3M", 868.3),
    "weather": lambda c, p: WeatherWorker(c, p, "433.92M", 433.92),  # backward alias
}


# --------------------------------------------------------------------------- #
# Agent — MQTT + mode supervision
# --------------------------------------------------------------------------- #
@dataclass
class Agent:
    cfg: Config
    client: mqtt.Client = field(init=False)
    _current: Worker | None = field(default=None, init=False)
    _mode: str = field(default="", init=False)
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _stop: threading.Event = field(default_factory=threading.Event)

    def __post_init__(self) -> None:
        self.client = mqtt.Client(client_id=f"spectra-agent-{self.cfg.sensor_id}")
        if self.cfg.mqtt_tls:
            self.client.tls_set()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    @property
    def _mode_topic(self) -> str:
        return f"{self.cfg.topic_prefix}/{self.cfg.sensor_id}/mode"

    def publish(self, subtopic: str, payload: dict[str, Any]) -> None:
        topic = f"{self.cfg.topic_prefix}/{self.cfg.sensor_id}/{subtopic}"
        payload.setdefault("sensor_id", self.cfg.sensor_id)
        payload.setdefault("ts", time.time())
        self.client.publish(topic, json.dumps(payload), qos=0)

    # ---- MQTT callbacks --------------------------------------------------- #
    def _on_connect(self, client, userdata, flags, rc, *args) -> None:
        log.info("connected to mqtt (rc=%s); subscribing to %s", rc, self._mode_topic)
        client.subscribe(self._mode_topic)
        # if nobody has set a mode yet, fall back to the default
        if not self._mode:
            self.set_mode(self.cfg.default_mode)

    def _on_message(self, client, userdata, msg) -> None:
        raw = msg.payload.decode(errors="ignore").strip()
        try:
            mode = json.loads(raw).get("mode", raw) if raw.startswith("{") else raw
        except json.JSONDecodeError:
            mode = raw
        self.set_mode(mode)

    # ---- mode switching --------------------------------------------------- #
    def set_mode(self, mode: str) -> None:
        mode = (mode or "").strip()
        if mode not in WORKERS:
            log.warning("unknown mode %r (known: %s)", mode, list(WORKERS))
            return
        with self._lock:
            if mode == self._mode and self._current is not None:
                return
            if self._current is not None:
                log.info("stopping mode %s", self._mode)
                self._current.stop()
                self._current = None
                time.sleep(1.0)  # let the HackRF be released
            log.info("starting mode %s", mode)
            self._current = WORKERS[mode](self.cfg, self.publish)
            self._current.start()
            self._mode = mode
        self._publish_status()

    def _publish_status(self) -> None:
        topic = f"{self.cfg.topic_prefix}/{self.cfg.sensor_id}/status"
        self.client.publish(topic, json.dumps({
            "sensor_id": self.cfg.sensor_id, "mode": self._mode,
            "available_modes": list(WORKERS), "ts": time.time(),
        }), qos=0, retain=True)

    # ---- lifecycle -------------------------------------------------------- #
    def run(self) -> None:
        log.info("connecting to mqtt %s:%s", self.cfg.mqtt_host, self.cfg.mqtt_port)
        self.client.connect(self.cfg.mqtt_host, self.cfg.mqtt_port, keepalive=60)
        self.client.loop_start()
        log.info("spectra agent v2 running as %s", self.cfg.sensor_id)
        while not self._stop.is_set():
            time.sleep(1)
        if self._current:
            self._current.stop()
        self.client.loop_stop()
        self.client.disconnect()

    def stop(self, *_: Any) -> None:
        log.info("shutting down")
        self._stop.set()


def main() -> int:
    logging.basicConfig(
        level=os.environ.get("SPECTRA_LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    cfg = Config.load(os.environ.get("SPECTRA_CONFIG", "config.yaml"))
    agent = Agent(cfg)
    signal.signal(signal.SIGTERM, agent.stop)
    signal.signal(signal.SIGINT, agent.stop)
    agent.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
