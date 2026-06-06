"""Spectra gateway — real-time bridge for the web frontend.

- subscribes to MQTT (sweep / devices / status) and fans messages out to all
  connected browsers over a WebSocket (/ws) — this is the real-time feed the
  React app renders (spectrum, waterfall, decoded objects, active mode).
- proxies historical queries to VictoriaMetrics (/api/query) and Loki
  (/api/logs) so the frontend never talks to the datastores directly.
- relays mode changes to the control service (/api/mode) so the UI can retune
  the HackRF.

Read-only with respect to the radio; it only forwards the control command.
"""
from __future__ import annotations

import asyncio
import json
import os

import aiomqtt
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

MQTT_HOST = os.environ.get("MQTT_HOST", "mosquitto.spectra.svc")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
VM_URL = os.environ.get("VM_URL", "http://vmsingle-victoria-metrics-single-server.spectra.svc:8428")
LOKI_URL = os.environ.get("LOKI_URL", "http://loki.spectra.svc:3100")
CONTROL_URL = os.environ.get("CONTROL_URL", "http://spectra-control.spectra.svc:8080")

app = FastAPI(title="spectra-gateway")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

clients: set[WebSocket] = set()


@app.get("/healthz")
async def healthz() -> PlainTextResponse:
    return PlainTextResponse("ok")


@app.websocket("/ws")
async def ws(websocket: WebSocket) -> None:
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()  # we don't expect input; keeps it open
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(websocket)


async def _broadcast(payload: str) -> None:
    dead = []
    for c in list(clients):
        try:
            await c.send_text(payload)
        except Exception:  # noqa: BLE001
            dead.append(c)
    for c in dead:
        clients.discard(c)


async def _mqtt_loop() -> None:
    while True:
        try:
            async with aiomqtt.Client(MQTT_HOST, MQTT_PORT) as client:
                for t in ("spectra/+/sweep", "spectra/+/devices", "spectra/+/status", "spectra/+/lora"):
                    await client.subscribe(t)
                async for msg in client.messages:
                    topic = str(msg.topic)
                    try:
                        data = json.loads(msg.payload.decode(errors="ignore"))
                    except json.JSONDecodeError:
                        continue
                    kind = topic.rsplit("/", 1)[-1]  # sweep|devices|status
                    await _broadcast(json.dumps({"topic": topic, "kind": kind, "data": data}))
        except Exception:  # noqa: BLE001 - reconnect on any MQTT error
            await asyncio.sleep(3)


@app.on_event("startup")
async def _startup() -> None:
    asyncio.create_task(_mqtt_loop())


@app.get("/api/query")
async def query(q: str):
    """Instant PromQL/MetricsQL query against VictoriaMetrics."""
    async with httpx.AsyncClient(timeout=10) as h:
        r = await h.get(f"{VM_URL}/api/v1/query", params={"query": q})
        return JSONResponse(r.json())


@app.get("/api/query_range")
async def query_range(q: str, start: str, end: str, step: str = "15"):
    async with httpx.AsyncClient(timeout=15) as h:
        r = await h.get(f"{VM_URL}/api/v1/query_range",
                        params={"query": q, "start": start, "end": end, "step": step})
        return JSONResponse(r.json())


@app.get("/api/logs")
async def logs(q: str = '{job="spectra-devices"}', limit: int = 100):
    async with httpx.AsyncClient(timeout=10) as h:
        r = await h.get(f"{LOKI_URL}/loki/api/v1/query_range",
                        params={"query": q, "limit": limit})
        return JSONResponse(r.json())


@app.post("/api/mode")
async def set_mode(sensor: str, mode: str):
    """Relay a mode change to the control service (retunes the HackRF)."""
    async with httpx.AsyncClient(timeout=8) as h:
        r = await h.get(f"{CONTROL_URL}/", params={"sensor": sensor, "mode": mode})
        return JSONResponse(r.json())
