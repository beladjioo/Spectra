# RF Academy — Architecture

## 1. What it is

A gamified, hands-on RF learning tool built around a HackRF. The user progresses through
**missions**, each of which teaches one band/concept and asks them to spot it live. The
whole RF engine + backend are **Rust**; the UI is React. Each node is a single k3s box
reconciled by ArgoCD from this repo.

## 2. One binary, one image

Everything the node runs is one Rust binary (`rf-academy`) with the built React UI baked
into its image:

```
                 ┌──────────────────────────────────────────────┐
  EDGE NODE      │  Raspberry Pi 5 + HackRF One                  │
  (per learner)  │  k3s (single node) + ArgoCD                   │
                 │  ┌────────────────────────────────────────┐  │
                 │  │ rf-academy (Rust, DaemonSet, priv USB)  │  │
                 │  │                                         │  │
                 │  │  SDR thread ── soapysdr (tunable)       │  │
                 │  │     │  IQ @ commanded center/rate/gain  │  │
                 │  │     ▼  rustfft → dB spectrum            │  │
                 │  │     ▼  feature extraction (dsp.rs)      │  │
                 │  │  broadcast ──▶ axum WS  /ws             │  │
                 │  │  axum REST  ◀── POST /api/tune          │  │
                 │  │  axum static ── serves /app/web (React) │  │
                 │  └──────────────────┬─────────────────────┘  │
                 │            :8090  →  NodePort 30920           │
                 └───────────────────────────────────────────────┘
                      ▲ ArgoCD reconciles the node from git
```

No MQTT, no separate gateway, no nginx — collapsed into the single binary. The browser
(phone/laptop on the LAN or the Pi's own WiFi AP) is the only external piece, and it only
reads + sends tune commands.

## 3. The Rust backend (`server/`)

- **`src/dsp.rs`** — the analysis core, generalised from the drone-detection agent into a
  *tunable, mode-agnostic* spectrum analyser:
  1. `Analyzer` averages Hann-windowed FFT power frames from live IQ (N=4096), fftshifts
     to DC, → dB.
  2. `extract` computes the noise floor (20th percentile), threshold = noise + SNR, finds
     contiguous occupied bands as `peaks` (each flagged `wideband` if ≥5 MHz ≈ a drone
     video link), the occupancy ratio, and a 256-point max-decimated trace for the UI
     (max, so narrow bursts stay visible).
  3. `FmDemod` — broadcast FM: boxcar-decimate the IQ to ~240 kHz, phase-discriminate,
     50 µs de-emphasis, decimate to ~48 kHz. The *exact* audio rate is reported in each
     `Frame` so the browser schedules buffers without drift.
  4. A built-in **simulator** (`synth`) generates a believable per-band spectrum so the
     app works with no SDR (forced by `SDR_SIM=1`, or automatic fallback).
- **`src/adsb.rs`** — a real Mode S / ADS-B decoder for 1090 MHz: magnitude
  max-decimation to 2 MSps, dump1090-style preamble detection, PPM bit-slicing, CRC-24
  validation, then DF17 parsing — callsign, altitude (Q-bit), airborne position via
  globally-unambiguous CPR (even/odd pairs), ground speed/track/vertical rate. Aircraft
  tracks ride on every `Frame` while tuned to 1090. Unit-tested against the canonical
  vectors from "The 1090 MHz Riddle".
- **`src/main.rs`** — a blocking SDR thread owns the radio (HackRF *or* RTL-SDR via
  SoapySDR; tune requests are sanitized and clamped per driver) and applies retune
  commands from the UI (`tokio::mpsc`); analysed frames go out on a `tokio::broadcast`
  channel. `axum` serves: `GET /ws` (frames), `GET /audio` (PCM), `POST /api/tune`,
  `/healthz`, and the static React build. Receive-only — nothing is transmitted.

Rust (not Python) because the FFT + per-bin scan + Mode S demod must keep up with a
multi-MHz stream on the Pi 5 CPU, and one static binary is the simplest thing to ship.

## 4. The UI (`web/`, React + Tailwind)

- `lib/useRf.ts` — WebSocket hook exposing the latest `Frame`, plus `tune()`.
- `missions.ts` — the curriculum: each mission has a band (→ `tune`), an objective
  evaluated against the live frame (`objectiveMet`), bible text, and XP.
- `components/Spectrum.tsx` (live FFT, peaks shaded) and `Waterfall.tsx` (canvas
  time-axis colormap).
- `App.tsx` — the gamified shell: XP/levels, mission grid with lock/unlock, and a mission
  view that tunes the radio, shows the bible, auto-validates the objective when the signal
  holds, and awards XP. Progress is stored in `localStorage`.

## 5. The curriculum & monetisation

| Mission | Band | Objective (evaluated on the live frame) | Tier |
|---|---|---|---|
| Premier contact | FM 98 MHz | observe the noise floor (manual validate) | free |
| Capter une radio FM | FM 100.2 | a narrowband peak with SNR ≥ 18 dB | free |
| ISM 868 | 868.3 MHz | catch any burst (a peak appears) | free |
| Le chaos du 2.4 GHz | 2.44 GHz | occupancy ≥ 4 % | free |
| Radar ADS-B | 1090 MHz | decode a real aircraft (DF17) | **Pro** |
| Capstone: drone | 2.44 GHz | a wideband (≥5 MHz) emission | **Pro** |

The **🎓 Examen** tab is the second product surface: a 40-question ANFR-style bank with
Leitner spaced repetition (free) and timed mock exams scored per domain (Pro). Pro is an
offline licence key (`web/src/lib/license.ts`, generated by `tools/genkey.mjs`) — an
honest gate, not DRM: the node often runs with no internet at all.

## 6. GitOps model

- **Single source of truth**: this repo. One deployable: `apps/rf-academy/` (kustomize:
  namespace + configmap + DaemonSet + NodePort).
- **Per node**: `clusters/rf-academy/root-app.yaml` is an ArgoCD app-of-apps pointing at
  `clusters/rf-academy/apps/`, which references `apps/rf-academy`. ArgoCD self-heals and
  prunes.
- **Onboarding**: flash a Pi, run `clusters/rf-academy/bootstrap-pi.sh` (k3s + ArgoCD +
  node label `spectra.io/hackrf=true` + root-app + a 5 GHz WiFi AP for white-zone access).
- **Image**: the `Dockerfile` builds the UI, then the Rust binary, then a slim runtime
  with the HackRF SoapySDR module; CI (`.github/workflows/rf-academy.yml`) pushes
  `ghcr.io/beladjioo/rf-academy` (arm64 for the Pi).

## 7. Honest scope

- Mission detection is **presence/feature based**, not full decoding. The drone capstone
  flags wideband energy; WiFi/BT can also trigger it (signature discrimination + Remote ID
  decode are future work). The standalone `edge/drone-agent` is kept as the original
  reference; its logic now lives, generalised, in `server/src/dsp.rs`.
- The simulator is for learning/demo without hardware; on a real HackRF the same code path
  analyses real IQ. dB values are relative and gain-dependent — good for *seeing* signals,
  not for calibrated measurements.
