#!/usr/bin/env python3
"""Spectra edge agent v3 — mode supervisor with band sweeps + live status.

A single HackRF listens to one band at a time, so the agent runs ONE "mode" and
switches on command (retained MQTT message spectra/<sensor>/mode):

  sweep868   : hackrf_sweep 863-870 MHz   (ISM)
  sweepfm    : hackrf_sweep 88-108 MHz    (FM broadcast — strong, great with a long whip)
  sweep24    : hackrf_sweep 2400-2483 MHz (WiFi / Bluetooth / microwave oven)
  weather433 : rtl_433 @433.92 MHz        (sensors -> spectra/<sensor>/devices)
  weather868 : rtl_433 @868.30 MHz

It publishes its active mode every few seconds on spectra/<sensor>/status (retained)
with a human band label, so the UI can show what the radio is doing right now.

Everything is receive-only. Nothing is transmitted.
"""
from __future__ import annotations

import json
import logging
import os
import queue
import signal
import subprocess
import threading
import time
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Callable

import paho.mqtt.client as mqtt
import yaml

log = logging.getLogger("spectra.agent")


@dataclass
class Config:
    sensor_id: str = "sensor-unknown"
    mqtt_host: str = "mosquitto.spectra.svc"
    mqtt_port: int = 1883
    mqtt_tls: bool = False
    topic_prefix: str = "spectra"
    default_mode: str = "sweep868"
    sweep_bin_width_hz: int = 100_000
    sweep_lna_gain: int = 32
    sweep_vga_gain: int = 20
    sweep_interval_s: float = 5.0
    noise_floor_dbm_threshold: float = -65.0
    weather_device: str = "soapy:driver=hackrf"
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
# Workers
# --------------------------------------------------------------------------- #
class Worker:
    band_label = "?"
    center_mhz = 0.0

    def __init__(self, cfg: Config, publish: Callable[[str, dict[str, Any]], None]):
        self.cfg = cfg
        self.publish = publish
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=8)

    def _run(self) -> None:  # pragma: no cover
        raise NotImplementedError


class SweepWorker(Worker):
    def __init__(self, cfg, publish, fmin_mhz: int, fmax_mhz: int, label: str,
                 bin_width_hz: int | None = None):
        super().__init__(cfg, publish)
        self.fmin = fmin_mhz
        self.fmax = fmax_mhz
        self.band_label = label
        self.center_mhz = round((fmin_mhz + fmax_mhz) / 2, 2)
        self.bin_width = bin_width_hz or cfg.sweep_bin_width_hz

    def _run(self) -> None:
        while not self._stop.is_set():
            started = time.time()
            try:
                self._one_sweep()
            except FileNotFoundError:
                log.error("hackrf_sweep not found"); self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("sweep failed")
            self._stop.wait(max(0.0, self.cfg.sweep_interval_s - (time.time() - started)))

    def _one_sweep(self) -> None:
        cmd = [
            "hackrf_sweep", "-f", f"{self.fmin}:{self.fmax}",
            "-w", str(self.bin_width),
            "-l", str(self.cfg.sweep_lna_gain), "-g", str(self.cfg.sweep_vga_gain), "-1",
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
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
            "band_mhz": [self.fmin, self.fmax], "band_label": self.band_label,
            "noise_floor_db": round(noise_floor, 2), "peak_db": round(ps[-1], 2),
            "occupancy_ratio": round(occupied / len(powers), 4),
            "interference": noise_floor > self.cfg.noise_floor_dbm_threshold,
            "bins": bins,
        })


class WeatherWorker(Worker):
    def __init__(self, cfg, publish, frequency: str, band_mhz: float):
        super().__init__(cfg, publish)
        self.frequency = frequency
        self.center_mhz = band_mhz
        self.band_label = f"Weather {band_mhz:g} MHz (rtl_433)"
        self.proc: subprocess.Popen | None = None

    def stop(self) -> None:
        # rtl_433 may be silent (no devices -> blocked on stdout read), so the
        # reader thread won't notice _stop. Kill the subprocess to unblock it AND
        # release the HackRF, otherwise the next mode gets "Resource busy".
        self._stop.set()
        p = self.proc
        if p and p.poll() is None:
            p.terminate()
            try:
                p.wait(timeout=3)
            except subprocess.TimeoutExpired:
                p.kill()
        if self._thread:
            self._thread.join(timeout=8)

    def _run(self) -> None:
        cmd = ["rtl_433", "-d", self.cfg.weather_device, "-f", self.frequency,
               "-s", self.cfg.weather_sample_rate, "-F", "json", "-M", "level"]
        while not self._stop.is_set():
            try:
                log.info("starting rtl_433: %s", " ".join(cmd))
                self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
                assert self.proc.stdout is not None
                for line in self.proc.stdout:
                    if self._stop.is_set():
                        break
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    self.publish("devices", {"kind": "weather", "band_mhz": self.center_mhz,
                                             "decode": event})
                if self.proc.poll() is None:
                    self.proc.terminate()
                    try:
                        self.proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self.proc.kill()
            except FileNotFoundError:
                log.error("rtl_433 not found"); self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("rtl_433 failed; retry in 5s"); self._stop.wait(5)


class ListenFmWorker(Worker):
    """Tunes the HackRF to one FM station, demodulates it (rx_fm), encodes MP3
    (ffmpeg) and broadcasts the live stream over HTTP on :8000 (GET /fm.mp3).
    A Grafana <audio> panel plays it. Exclusive use of the HackRF."""

    AUDIO_PORT = 8000

    def __init__(self, cfg, publish, freq_mhz: float):
        super().__init__(cfg, publish)
        self.freq_mhz = freq_mhz
        self.center_mhz = freq_mhz
        self.band_label = f"🎧 FM {freq_mhz:g} MHz (live audio)"
        self._procs: list[subprocess.Popen] = []
        self._httpd: ThreadingHTTPServer | None = None
        self._clients: set[queue.Queue] = set()
        self._clients_lock = threading.Lock()

    def stop(self) -> None:
        self._stop.set()
        if self._httpd:
            try:
                self._httpd.shutdown()
            except Exception:  # noqa: BLE001
                pass
        for p in self._procs:
            if p.poll() is None:
                p.terminate()
        time.sleep(0.5)
        for p in self._procs:
            if p.poll() is None:
                p.kill()
        if self._thread:
            self._thread.join(timeout=8)

    def _serve(self) -> None:
        w = self

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                q: queue.Queue = queue.Queue(maxsize=128)
                with w._clients_lock:
                    w._clients.add(q)
                try:
                    while not w._stop.is_set():
                        try:
                            self.wfile.write(q.get(timeout=1))
                        except queue.Empty:
                            continue
                except (BrokenPipeError, ConnectionResetError):
                    pass
                finally:
                    with w._clients_lock:
                        w._clients.discard(q)

            def log_message(self, *a):
                pass

        self._httpd = ThreadingHTTPServer(("0.0.0.0", self.AUDIO_PORT), Handler)
        self._httpd.daemon_threads = True
        self._httpd.serve_forever()

    def _run(self) -> None:
        threading.Thread(target=self._serve, daemon=True).start()
        rx = ["python3", "/app/fm_demod.py", str(self.freq_mhz)]
        ff = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "s16le",
              "-ar", "48000", "-ac", "1", "-i", "pipe:0",
              "-c:a", "libmp3lame", "-b:a", "96k", "-f", "mp3", "pipe:1"]
        while not self._stop.is_set():
            try:
                log.info("listen_fm: %s | ffmpeg mp3", " ".join(rx))
                rxp = subprocess.Popen(rx, stdout=subprocess.PIPE)
                ffp = subprocess.Popen(ff, stdin=rxp.stdout, stdout=subprocess.PIPE)
                rxp.stdout.close()  # type: ignore[union-attr]
                self._procs = [rxp, ffp]
                assert ffp.stdout is not None
                while not self._stop.is_set():
                    chunk = ffp.stdout.read(4096)
                    if not chunk:
                        break
                    with self._clients_lock:
                        clients = list(self._clients)
                    for q in clients:
                        try:
                            q.put_nowait(chunk)
                        except queue.Full:
                            pass
                for p in (rxp, ffp):
                    if p.poll() is None:
                        p.terminate()
            except FileNotFoundError:
                log.error("rx_fm/ffmpeg not found"); self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("listen_fm failed; retry in 5s"); self._stop.wait(5)


class LoRaActivityWorker(Worker):
    """Runs lora_activity.py: detects LoRa uplink bursts on 868 g1 and publishes
    a coverage summary (bursts/min + strength) to spectra/<sensor>/lora."""

    band_label = "Activité LoRa · 868 g1"
    center_mhz = 868.3

    def __init__(self, cfg, publish):
        super().__init__(cfg, publish)
        self.proc: subprocess.Popen | None = None

    def stop(self) -> None:
        self._stop.set()
        p = self.proc
        if p and p.poll() is None:
            p.terminate()
            try:
                p.wait(timeout=3)
            except subprocess.TimeoutExpired:
                p.kill()
        if self._thread:
            self._thread.join(timeout=8)

    def _run(self) -> None:
        cmd = ["python3", "/app/lora_activity.py"]
        while not self._stop.is_set():
            try:
                log.info("starting lora_activity")
                self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)
                assert self.proc.stdout is not None
                for line in self.proc.stdout:
                    if self._stop.is_set():
                        break
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        ev = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    self.publish("lora", ev)
                if self.proc.poll() is None:
                    self.proc.terminate()
            except FileNotFoundError:
                log.error("lora_activity.py / python3 missing"); self._stop.wait(30)
            except Exception:  # noqa: BLE001
                log.exception("lora_activity failed; retry in 5s"); self._stop.wait(5)


WORKERS: dict[str, Callable[[Config, Callable[[str, dict[str, Any]], None]], Worker]] = {
    "sweep868":  lambda c, p: SweepWorker(c, p, 863, 870, "868 ISM (863-870 MHz)"),
    "lora_activity": lambda c, p: LoRaActivityWorker(c, p),
    "sweepfm":   lambda c, p: SweepWorker(c, p, 88, 108, "FM radio (88-108 MHz)"),
    "sweep24":   lambda c, p: SweepWorker(c, p, 2400, 2483, "2.4 GHz WiFi/BT", 1_000_000),
    "weather433": lambda c, p: WeatherWorker(c, p, "433.92M", 433.92),
    "weather868": lambda c, p: WeatherWorker(c, p, "868.3M", 868.3),
    # backward aliases
    "sweep": lambda c, p: SweepWorker(c, p, 863, 870, "868 ISM (863-870 MHz)"),
    "weather": lambda c, p: WeatherWorker(c, p, "433.92M", 433.92),
}


# --------------------------------------------------------------------------- #
# Agent
# --------------------------------------------------------------------------- #
@dataclass
class Agent:
    cfg: Config
    client: mqtt.Client = field(init=False)
    _current: Worker | None = field(default=None, init=False)
    _mode: str = field(default="", init=False)
    _lock: threading.Lock = field(default_factory=threading.Lock)
    _stop: threading.Event = field(default_factory=threading.Event)
    _sdr: dict[str, Any] = field(default_factory=dict)

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

    def _on_connect(self, client, userdata, flags, rc, *args) -> None:
        log.info("connected to mqtt (rc=%s); subscribing to %s", rc, self._mode_topic)
        client.subscribe(self._mode_topic)
        if not self._mode:
            self.set_mode(self.cfg.default_mode)

    def _on_message(self, client, userdata, msg) -> None:
        raw = msg.payload.decode(errors="ignore").strip()
        try:
            mode = json.loads(raw).get("mode", raw) if raw.startswith("{") else raw
        except json.JSONDecodeError:
            mode = raw
        self.set_mode(mode)

    def _factory(self, mode: str):
        if mode in WORKERS:
            return WORKERS[mode]
        if mode.startswith("listenfm:"):  # listenfm:100.0 -> tune & stream that station
            try:
                f = float(mode.split(":", 1)[1])
            except ValueError:
                return None
            return lambda c, p: ListenFmWorker(c, p, f)
        return None

    def set_mode(self, mode: str) -> None:
        mode = (mode or "").strip()
        factory = self._factory(mode)
        if factory is None:
            log.warning("unknown mode %r (known: %s + listenfm:<freq>)", mode, list(WORKERS))
            return
        with self._lock:
            if mode == self._mode and self._current is not None:
                return
            if self._current is not None:
                log.info("stopping mode %s", self._mode)
                self._current.stop()
                self._current = None
                time.sleep(1.0)
            log.info("starting mode %s", mode)
            self._current = factory(self.cfg, self.publish)
            self._current.start()
            self._mode = mode
        self._publish_status()

    def _probe_sdr(self) -> dict[str, Any]:
        """Run hackrf_info once (at startup, device free) to report the SDR to the UI."""
        try:
            out = subprocess.run(["hackrf_info"], capture_output=True, text=True, timeout=8).stdout
        except FileNotFoundError:
            return {"present": False, "detail": "hackrf tools missing"}
        except Exception as e:  # noqa: BLE001
            return {"present": False, "detail": str(e)}
        if "Found HackRF" not in out:
            return {"present": False, "detail": "no HackRF detected"}

        def field_(key: str) -> str:
            return next((l.split(":", 1)[-1].strip() for l in out.splitlines() if key in l), "")

        serial = field_("Serial number")
        return {"present": True, "board": field_("Board ID Number") or "HackRF",
                "serial": serial[-8:] if serial else "", "firmware": field_("Firmware Version")}

    def _publish_status(self) -> None:
        w = self._current
        topic = f"{self.cfg.topic_prefix}/{self.cfg.sensor_id}/status"
        self.client.publish(topic, json.dumps({
            "sensor_id": self.cfg.sensor_id, "mode": self._mode,
            "band_label": w.band_label if w else "idle",
            "center_mhz": w.center_mhz if w else 0,
            "sdr": self._sdr, "active": 1, "ts": time.time(),
        }), qos=0, retain=True)

    def _heartbeat(self) -> None:
        while not self._stop.is_set():
            if self._mode:
                self._publish_status()
            self._stop.wait(10)

    def run(self) -> None:
        self._sdr = self._probe_sdr()  # device is free at startup
        log.info("SDR: %s", self._sdr)
        log.info("connecting to mqtt %s:%s", self.cfg.mqtt_host, self.cfg.mqtt_port)
        self.client.connect(self.cfg.mqtt_host, self.cfg.mqtt_port, keepalive=60)
        self.client.loop_start()
        threading.Thread(target=self._heartbeat, daemon=True).start()
        log.info("spectra agent v3 running as %s", self.cfg.sensor_id)
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
