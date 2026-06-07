# RF Academy — Learn RF by doing, with a HackRF (all-Rust, GitOps)

> A gamified "HackRF bible": plug in the SDR and progress through missions that
> teach you radio by *doing* it — read a spectrum, catch an FM station, surprise an
> IoT burst on 868 MHz, survive the 2.4 GHz chaos, and (capstone) detect a drone.
> The whole RF engine and backend are written in **Rust**; the UI is React. Each
> node is a self-contained k3s box managed by **ArgoCD pulling this repo** — nothing
> is installed by hand.

Passive, **receive-only** — the HackRF only ever listens; nothing is transmitted.

## Why

- **RF is intimidating.** Most SDR tools throw a wall of knobs at you. RF Academy is a
  guided, gamified path from "what is a dB?" to "I detected a drone."
- **All-Rust engine.** The FFT/feature DSP runs comfortably on a Pi 5 CPU (no GPU),
  generalised from a real drone-detection agent into a *tunable* spectrum analyser.
- **GitOps to the edge.** One image, declared in git, reconciled by ArgoCD. Reproducible,
  and it runs with no internet once pulled.

## Architecture — one image, one binary

```
EDGE NODE (Pi 5 + HackRF, k3s + ArgoCD)
  rf-academy  (Rust, DaemonSet, privileged USB)
     ┌──────────────────────────────────────────────┐
     │ HackRF (tunable) → rustfft → spectrum/features │  ← POST /api/tune (per mission)
     │ axum: serves the React UI + streams /ws        │
     └──────────────────────────────────────────────┘
        :8090  →  NodePort 30920
  React UI (baked into the image): missions, XP/levels, live spectrum + waterfall
```

No MQTT, no separate gateway, no nginx — the single Rust binary owns the radio, runs the
DSP, and serves the UI. If no HackRF is present it falls back to a **built-in simulator**,
so the app always runs (great for demos and CI).

## Repository layout

```
.
├── server/            # the all-Rust backend (axum + tokio + rustfft + soapysdr)
│   └── src/dsp.rs     # tunable spectrum analyser (drone detection generalised)
├── web/               # React + Tailwind UI: missions, spectrum, waterfall
├── Dockerfile         # one image: build UI → build Rust → runtime (HackRF SoapySDR)
├── apps/rf-academy/   # k8s: namespace + configmap + DaemonSet + NodePort
├── clusters/rf-academy/  # ArgoCD app-of-apps + per-node bootstrap (bootstrap-pi.sh)
├── edge/drone-agent/  # standalone drone detector (kept as reference; folded into server/)
└── docs/ARCHITECTURE.md
```

## Deploy (GitOps — the real path)

```bash
# On a fresh Pi 5 (arm64), HackRF plugged in over USB:
sudo ./clusters/rf-academy/bootstrap-pi.sh
# installs k3s + ArgoCD, labels the node, applies the app-of-apps.
# ArgoCD then pulls ghcr.io/beladjioo/rf-academy and runs it.
```

Open the UI from your phone/laptop:

- Normal LAN: `http://<pi-ip>:30920` or `http://<hostname>.local:30920`
- **White zone** (no cell): the bootstrap also makes the Pi its own WiFi AP (SSID
  `RF-Academy`, on **5 GHz** so it doesn't jam the 2.4 GHz HackRF) → join it and open
  `http://10.42.0.1:30920`. Updates come via ethernet or `nmcli con down rf-academy-ap`.

## Local dev (sanity check only — not the deployment)

```bash
cd web && npm install && npm run build
cd ../server && STATIC_DIR=../web/dist cargo run --release   # HackRF auto-detected; else sim
# → http://localhost:8090
```

## The curriculum

| Mission | Band | You learn |
|---|---|---|
| 📡 Premier contact | FM 98 MHz | spectrum, noise floor, dB, gain |
| 📻 Capter une radio FM | FM 100.2 | carriers, SNR, FM modulation |
| 📶 ISM 868 | 868.3 MHz | IoT/LoRa bursts, duty-cycle |
| 🌐 Le chaos du 2.4 GHz | 2.44 GHz | WiFi/BT, OFDM, occupancy |
| 🚁 Capstone: drone | 2.44 GHz | wideband video link detection |

## License

Apache-2.0 (see `LICENSE`).
