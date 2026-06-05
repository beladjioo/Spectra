# Spectra — RF & IoT Observability for Smart Cities

> Passive radio-frequency monitoring platform. A HackRF-powered edge sensor listens
> to the urban ISM bands, decodes active IoT devices, measures spectrum occupancy and
> the noise floor, and detects interference — all streamed into a GitOps-managed,
> cloud-native stack.

**Core use case (MVP):** *ISM interference detection & IoT network health.*
Operators of LoRaWAN / 433–868 MHz sensor fleets (smart parking, waste, metering,
weather) need to know **why a sensor goes silent**. Spectra sees the RF noise their
sensors cannot, and turns "the band is congested at 868.3 MHz" into an actionable alert.

## Why this project

- **Showcase**: SDR + edge computing + Kubernetes + GitOps + full-stack observability.
- **Future-proof**: spectrum monitoring is a growing market (massive IoT, 5G, GPS/drone
  jamming, regulatory pressure).
- **Sellable**: naturally multi-tenant — one edge sensor + one dashboard per customer.
- **Open core**: the agent, decoders and Helm charts are OSS; the multi-tenant SaaS layer
  stays commercial.

## Architecture (high level)

```
EDGE (HackRF + RPi/mini-PC, k3s + Flux)
  hackrf_sweep ──▶ ISM band occupancy / noise floor
  rtl_433 (SoapySDR/HackRF) ──▶ decoded device events
        │ MQTT over TLS
        ▼
CLUSTER (k3s homelab, ArgoCD app-of-apps)
  Mosquitto ──▶ Telegraf (ingest) ──▶ VictoriaMetrics ──▶ Grafana
                                          │
                                      vmalert ──▶ Alertmanager (interference alerts)
```

Git is the single source of truth. ArgoCD reconciles the cluster; Flux reconciles edge
sensors (pull-based, NAT-friendly).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed design.

## Repository layout

```
.
├── docs/                  # Architecture, runbooks, decisions
├── edge/                  # HackRF edge agent (container) + edge GitOps (Flux)
│   ├── agent/             # Python agent: sweep + decode → MQTT
│   └── flux/              # Kustomization deployed on each sensor
├── apps/                  # ArgoCD Applications (one folder per platform component)
│   ├── mosquitto/
│   ├── victoriametrics/
│   ├── telegraf/
│   ├── grafana/
│   └── alerting/
├── clusters/
│   └── homelab/           # Bootstrap + app-of-apps root for the central cluster
└── Makefile               # Local dev shortcuts
```

## Quick start

```bash
# 0. Prerequisites: a k3s cluster, kubectl, helm, argocd CLI, and a HackRF on the edge.
make bootstrap        # install ArgoCD on the homelab cluster
make root-app         # apply the app-of-apps root Application
make edge-build       # build the edge agent container image
```

Then point your browser at Grafana (see `apps/grafana/`) and watch the ISM band.

## Status

🚧 Scaffold. Components are wired but values/secrets are placeholders — see the TODOs in
each `apps/*/` folder and in `edge/agent/config.example.yaml`.

## License

OSS core under Apache-2.0 (see `LICENSE`). Commercial multi-tenant layer is out of tree.
