# Spectra — Architecture

## 1. Problem & value

Smart-city sensor fleets (LoRaWAN, 433/868/915 MHz SRD) fail silently. The usual
telemetry tells you *that* a sensor stopped reporting, never *why*. The "why" is often
**RF**: a new interferer, a congested sub-band, a rising noise floor. Spectra adds a
passive SDR ear that sees the radio environment the sensors live in.

**MVP value proposition:** *ISM interference detection & IoT network health.*

## 2. Topology

```
                     ┌──────────────────────────────────────────┐
   EDGE (per site)   │  k3s node + HackRF One                    │
                     │  ┌─────────────────────────────────────┐  │
                     │  │ spectra-agent (DaemonSet, privileged)│  │
                     │  │   hackrf_sweep  → occupancy/noise    │  │
                     │  │   rtl_433       → decoded devices    │  │
                     │  └───────────────┬─────────────────────┘  │
                     │   Flux pulls edge/flux/ from git          │
                     └───────────────────┼──────────────────────┘
                                         │ MQTT/TLS (8883)
                     ┌───────────────────▼──────────────────────┐
   CENTRAL (homelab) │  k3s + ArgoCD (app-of-apps)               │
                     │  Mosquitto → Telegraf → VictoriaMetrics   │
                     │                              │            │
                     │                          vmalert ─▶ alerts│
                     │  Grafana ◀── VictoriaMetrics              │
                     └──────────────────────────────────────────┘
                          ▲ ArgoCD reconciles from git (push-free)
```

## 3. Data flow & schema

The agent publishes line-delimited JSON to MQTT:

| Topic                      | Producer       | Key fields |
|----------------------------|----------------|------------|
| `spectra/<sensor>/sweep`   | `hackrf_sweep` | `noise_floor_db`, `peak_db`, `occupancy_ratio`, `interference`, `bins[]` |
| `spectra/<sensor>/devices` | `rtl_433`      | `decode{model, id, rssi, snr, …}` |

Telegraf's `json_v2` parser maps these into VictoriaMetrics measurements
(`rf_sweep_*`, `rf_devices_*`) tagged by `sensor_id`. Retention: 3 months (homelab),
tune per tenant in production.

## 4. GitOps model

- **Single source of truth**: this repo.
- **Central cluster**: ArgoCD app-of-apps. `clusters/homelab/root-app.yaml` watches
  `clusters/homelab/apps/`; each child Application is a platform component. Adding a
  component = committing a manifest.
- **Edge**: Flux (pull-based, NAT-friendly) reconciles `edge/flux/` on each sensor.
  Sensors self-heal and converge without inbound connectivity.
- **Secrets**: never in git. sealed-secrets or SOPS+age. Placeholders are flagged with
  `CHANGEME` / `TODO` throughout.

## 5. Interference detection logic

1. Each sweep computes a robust noise floor (~10th percentile of per-bin power) and an
   occupancy ratio (fraction of bins above threshold).
2. `interference` is raised when the noise floor crosses a **site-calibrated** baseline.
3. vmalert turns sustained interference, fast noise-floor rises, and sensor silence into
   actionable alerts (`apps/alerting/rules.yaml`).

> Calibration matters: the dB scale from `hackrf_sweep` is relative and gain-dependent.
> Establish a quiet-baseline per site before trusting absolute thresholds.

## 6. Roadmap

**M0 — Scaffold (done):** repo, agent, GitOps wiring, starter dashboard + alerts.

**M1 — Single sensor, real data:** calibrate, validate decode rates, refine thresholds,
add a `bins[]`→heatmap (waterfall) panel.

**M2 — Multi-sensor fleet:** per-sensor onboarding flow, fleet health view, sealed-secrets.

**M3 — Productisation (open core):**
- Multi-tenant isolation (namespace-per-tenant, per-tenant MQTT auth/ACL).
- Onboarding API + provisioning of edge images.
- SLA reporting / exportable "spectrum health" PDFs for customers.
- Optional: cloud control plane (hybrid) while edge stays on-prem.

**Possible extensions** (separate, reusing the same pipeline): ADS-B/AIS mobility,
GPS-jamming detection, rogue-transmitter geolocation with ≥2 sensors (TDoA).

## 7. Why these technology choices

| Concern        | Choice              | Rationale |
|----------------|---------------------|-----------|
| Edge GitOps    | Flux                | Light, pull-based, works behind NAT |
| Central GitOps | ArgoCD              | Great UI for demos; app-of-apps scales cleanly |
| Bus            | Mosquitto/MQTT      | The IoT lingua franca; trivial on the edge |
| Ingest         | Telegraf            | Native MQTT + flexible JSON parsing, no custom code |
| TSDB           | VictoriaMetrics     | Cheap, fast, Prometheus-compatible, single-binary |
| Viz/alerts     | Grafana + vmalert   | Standard, provisioned-as-code |
| Decode         | rtl_433 + SoapySDR  | Huge device coverage, HackRF-compatible |
| Spectrum       | hackrf_sweep        | First-party, reliable wideband power sweep |
