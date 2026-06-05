#!/usr/bin/env python3
"""Spectra edge agent.

Runs on the edge node next to the HackRF. Two passive data sources:

1. ``hackrf_sweep`` — sweeps the configured ISM band and reports power (dB) per
   frequency bin. We derive band occupancy and the noise floor; a rising noise
   floor in an ISM sub-band is the primary interference signal.

2. ``rtl_433`` (via the SoapySDR HackRF driver) — decodes traffic from common
   433/868/915 MHz devices and emits one JSON event per decoded frame. We use the
   *rate* and *RSSI* of these events as a proxy for IoT network health.

Both streams are published to MQTT as line-delimited JSON. Nothing is transmitted —
this is receive-only.

This is a scaffold: the subprocess plumbing is real, but tune the frequencies,
gains and thresholds in ``config.yaml`` before trusting the numbers.
"""
from __future__ import annotations

import json
import logging
import os
import signal
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from typing import Any

import paho.mqtt.client as mqtt
import yaml

log = logging.getLogger("spectra.agent")


@dataclass
class Config:
    sensor_id: str
    mqtt_host: str
    mqtt_port: int = 8883
    mqtt_tls: bool = True
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    topic_prefix: str = "spectra"
    # hackrf_sweep params
    sweep_freq_min_mhz: int = 863
    sweep_freq_max_mhz: int = 870
    sweep_bin_width_hz: int = 100_000
    sweep_lna_gain: int = 32
    sweep_vga_gain: int = 20
    sweep_interval_s: float = 5.0
    # rtl_433 params
    rtl433_enabled: bool = True
    rtl433_device: str = "soapy:driver=hackrf"
    rtl433_frequency: str = "868.3M"
    rtl433_sample_rate: str = "1024k"
    # interference detection
    noise_floor_dbm_threshold: float = -65.0

    @classmethod
    def load(cls, path: str) -> "Config":
        with open(path) as fh:
            raw = yaml.safe_load(fh) or {}
        # env overrides for secrets injected by k8s
        raw.setdefault("mqtt_username", os.environ.get("SPECTRA_MQTT_USERNAME"))
        raw.setdefault("mqtt_password", os.environ.get("SPECTRA_MQTT_PASSWORD"))
        raw.setdefault("sensor_id", os.environ.get("SPECTRA_SENSOR_ID", "sensor-unknown"))
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        return cls(**{k: v for k, v in raw.items() if k in known})


@dataclass
class Agent:
    cfg: Config
    client: mqtt.Client = field(init=False)
    _stop: threading.Event = field(default_factory=threading.Event)

    def __post_init__(self) -> None:
        self.client = mqtt.Client(client_id=f"spectra-{self.cfg.sensor_id}")
        if self.cfg.mqtt_username:
            self.client.username_pw_set(self.cfg.mqtt_username, self.cfg.mqtt_password)
        if self.cfg.mqtt_tls:
            self.client.tls_set()

    # ---- MQTT -------------------------------------------------------------
    def connect(self) -> None:
        log.info("connecting to mqtt %s:%s", self.cfg.mqtt_host, self.cfg.mqtt_port)
        self.client.connect(self.cfg.mqtt_host, self.cfg.mqtt_port, keepalive=60)
        self.client.loop_start()

    def publish(self, subtopic: str, payload: dict[str, Any]) -> None:
        topic = f"{self.cfg.topic_prefix}/{self.cfg.sensor_id}/{subtopic}"
        payload.setdefault("sensor_id", self.cfg.sensor_id)
        payload.setdefault("ts", time.time())
        self.client.publish(topic, json.dumps(payload), qos=0)

    # ---- hackrf_sweep -----------------------------------------------------
    def run_sweep_loop(self) -> None:
        """One hackrf_sweep pass per interval; summarise into per-bin power."""
        while not self._stop.is_set():
            started = time.time()
            try:
                self._one_sweep()
            except FileNotFoundError:
                log.error("hackrf_sweep not found — is hackrf installed on the edge?")
                self._stop.wait(30)
            except Exception:  # noqa: BLE001 - keep the loop alive on the edge
                log.exception("sweep failed")
            elapsed = time.time() - started
            self._stop.wait(max(0.0, self.cfg.sweep_interval_s - elapsed))

    def _one_sweep(self) -> None:
        cmd = [
            "hackrf_sweep",
            "-f", f"{self.cfg.sweep_freq_min_mhz}:{self.cfg.sweep_freq_max_mhz}",
            "-w", str(self.cfg.sweep_bin_width_hz),
            "-l", str(self.cfg.sweep_lna_gain),
            "-g", str(self.cfg.sweep_vga_gain),
            "-1",  # one sweep then exit
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        bins: list[dict[str, float]] = []
        powers: list[float] = []
        # hackrf_sweep CSV: date, time, hz_low, hz_high, hz_bin_width, num_samples, dB, dB, ...
        for line in proc.stdout.splitlines():
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 7:
                continue
            try:
                hz_low = float(parts[2])
                hz_bin_width = float(parts[4])
                db_values = [float(p) for p in parts[6:]]
            except ValueError:
                continue
            for i, db in enumerate(db_values):
                freq_hz = hz_low + (i + 0.5) * hz_bin_width
                bins.append({"freq_mhz": round(freq_hz / 1e6, 4), "power_db": db})
                powers.append(db)
        if not powers:
            return
        powers_sorted = sorted(powers)
        noise_floor = powers_sorted[len(powers_sorted) // 10]  # ~10th percentile
        peak = powers_sorted[-1]
        occupied = sum(1 for p in powers if p > self.cfg.noise_floor_dbm_threshold)
        self.publish("sweep", {
            "band_mhz": [self.cfg.sweep_freq_min_mhz, self.cfg.sweep_freq_max_mhz],
            "noise_floor_db": round(noise_floor, 2),
            "peak_db": round(peak, 2),
            "occupancy_ratio": round(occupied / len(powers), 4),
            "interference": noise_floor > self.cfg.noise_floor_dbm_threshold,
            "bins": bins,
        })
        log.debug("sweep: floor=%.1f peak=%.1f occ=%.2f",
                  noise_floor, peak, occupied / len(powers))

    # ---- rtl_433 ----------------------------------------------------------
    def run_rtl433_loop(self) -> None:
        if not self.cfg.rtl433_enabled:
            return
        cmd = [
            "rtl_433",
            "-d", self.cfg.rtl433_device,
            "-f", self.cfg.rtl433_frequency,
            "-s", self.cfg.rtl433_sample_rate,
            "-F", "json",
            "-M", "level",  # include RSSI/SNR/noise per frame
        ]
        while not self._stop.is_set():
            try:
                log.info("starting rtl_433: %s", " ".join(cmd))
                proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
                assert proc.stdout is not None
                for line in proc.stdout:
                    if self._stop.is_set():
                        proc.terminate()
                        break
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    self.publish("devices", {"decode": event})
            except FileNotFoundError:
                log.error("rtl_433 not found — install it with SoapySDR/HackRF support")
                self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("rtl_433 loop failed; restarting in 5s")
                self._stop.wait(5)

    # ---- lifecycle --------------------------------------------------------
    def run(self) -> None:
        self.connect()
        threads = [
            threading.Thread(target=self.run_sweep_loop, name="sweep", daemon=True),
            threading.Thread(target=self.run_rtl433_loop, name="rtl433", daemon=True),
        ]
        for t in threads:
            t.start()
        log.info("spectra agent running as %s", self.cfg.sensor_id)
        while not self._stop.is_set():
            time.sleep(1)
        for t in threads:
            t.join(timeout=5)
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
    cfg_path = os.environ.get("SPECTRA_CONFIG", "config.yaml")
    cfg = Config.load(cfg_path)
    agent = Agent(cfg)
    signal.signal(signal.SIGTERM, agent.stop)
    signal.signal(signal.SIGINT, agent.stop)
    agent.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
