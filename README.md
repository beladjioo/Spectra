# OpenHertz — learn radio by doing it, with a real SDR

[![Try it live](https://img.shields.io/badge/try%20it-openhertz.org-2ea043)](https://openhertz.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![100% free](https://img.shields.io/badge/100%25-free%20%26%20open%20source-orange)](#license)
[![Receive-only](https://img.shields.io/badge/RF-receive--only-lightgrey)](#)

> A gamified "SDR handbook": plug in an **RTL-SDR (~$30)** or a **HackRF**, or use
> the built-in simulator, and progress mission by mission — read a spectrum,
> catch an FM station (demodulated live in your browser), surprise a LoRa burst,
> survive the 2.4 GHz chaos, **decode aircraft over ADS-B**, and detect a drone.
> All-**Rust** DSP engine; React UI; a bilingual (EN/FR) Obsidian-style library;
> built-in **amateur-radio exam** preparation.

**100% free and open source.** Passive, **receive-only** — the SDR only ever
listens; nothing is transmitted. Development is funded entirely by voluntary
[donations on Ko-fi](https://ko-fi.com/spectrarf).

👉 **Try it now — no install, no account: [openhertz.org](https://openhertz.org)**

## Contents

- [Why](#why)
- [What you get](#what-you-get-all-of-it-for-free)
- [Three ways to run the radio](#three-ways-to-run-the-radio)
- [Repository](#repository)
- [Local development](#local-development)
- [The curriculum](#the-curriculum)
- [License](#license)

## Why

- **RF is intimidating.** Classic SDR tools throw a wall of knobs at you.
  OpenHertz is a guided, gamified path from "what's a dB?" to "I just decoded an
  airliner."
- **Real decoding, not just detection.** The engine demodulates FM (50 µs
  de-emphasis included) and decodes Mode S/ADS-B (CRC-24, global CPR position) —
  and does it **entirely in the browser** via WebUSB + a TypeScript DSP, so
  there's no server to run.
- **It always works.** With no hardware, a built-in simulator takes over: the app
  demos itself, is tested in CI, and runs as a fully functional free site.
- **Bilingual, exam-focused.** Curriculum, Obsidian-style library (wikilinks,
  backlinks) and ANFR-style quiz in both English and French — a niche no one else
  covers well.

## What you get (all of it, for free)

| | |
|---|---|
| Guided 5-stage journey, from first dB to the licence | ✅ |
| Free-tuning SDR console + live FM demodulation | ✅ |
| Geolocated coverage map + live ADS-B aircraft | ✅ |
| Full bilingual library (30+ notes), wikilinks & backlinks | ✅ |
| Exam prep: spaced-repetition revision **and** timed mock exams | ✅ |
| Electronic-warfare & battlefield-drones chapters | ✅ |
| Drive a real RTL-SDR / HackRF from the browser (WebUSB, Chrome/Edge) | ✅ |

No accounts, no keys, no paywall. If the tool teaches you something, you can
support its development on Ko-fi — that's the whole business model.

## Three ways to run the radio

OpenHertz arbitrates between signal sources automatically, best first:

1. **WebUSB (recommended, zero server).** In Chrome/Edge, plug in an RTL-SDR or a
   HackRF and the browser drives it directly — all DSP runs on *your* machine.
2. **Backend appliance.** The Rust server (axum + tokio + rustfft + soapysdr)
   owns a locally-attached SDR and streams frames over WebSocket. Designed for a
   Raspberry Pi 5 homelab, ideal for fixed/white-zone installs.
3. **In-browser simulator.** No hardware at all: synthetic spectra and ADS-B
   traffic, so the site is fully usable by anyone.

```
 browser (Chrome/Edge)                         optional appliance (Pi 5 + SDR)
  ┌───────────────────────────────┐             ┌──────────────────────────────┐
  │ WebUSB driver (RTL / HackRF)  │             │ Rust: SDR → rustfft (Hann)   │
  │  → client DSP (FFT, FM, ADS-B)│             │   → FM demod → PCM (WS)      │
  │  → React UI                   │  ── or ──>  │   → ADS-B 1090 (CRC, CPR)    │
  │  → in-browser simulator       │   WS /ws    │ axum serves the same UI      │
  └───────────────────────────────┘             └──────────────────────────────┘
```

## Repository

```
.
├── web/                  # React + Tailwind UI (missions, console, map, exam, library)
│   ├── src/lib/dsp.ts    # client-side DSP: radix-2 FFT, FM demod, frame extraction
│   ├── src/lib/webusb.ts # WebUSB lifecycle (RTL-SDR + HackRF), hot retune, audio
│   ├── src/lib/hackrf.ts # from-scratch HackRF One WebUSB driver (libhackrf subset)
│   ├── content/{en,fr}/  # the bilingual knowledge base (markdown, wikilinks)
│   └── src/quiz.ts       # ANFR-style question bank
├── server/               # optional Rust backend (axum + tokio + rustfft + soapysdr)
│   ├── src/dsp.rs        # spectral analysis + FM demod (unit-tested)
│   └── src/adsb.rs       # full Mode S/ADS-B decoder (tested against known vectors)
└── Dockerfile            # one image: UI → Rust → runtime (HackRF + RTL-SDR)
```

## Local development

```bash
# Static site (WebUSB + simulator) — no backend needed:
cd web && npm install && npm run build && npx vite preview

# Optional Rust backend with a real or simulated SDR:
cd server && SDR_SIM=1 STATIC_DIR=../web/dist cargo run --release   # → http://localhost:8090
cargo test        # DSP + ADS-B decoder (canonical test vectors)
```

## The curriculum

| Mission | Band | What you learn |
|---|---|---|
| First contact | FM 98 MHz | spectrum, noise floor, dB, gain |
| Catch an FM station | 100.2 MHz | carriers, SNR, FM modulation |
| ISM 868 | 868.3 MHz | IoT/LoRa bursts, duty-cycle |
| The 2.4 GHz chaos | 2.44 GHz | WiFi/BT, OFDM, occupancy |
| ADS-B radar | 1090 MHz | PPM demodulation, CRC, CPR decoding |
| Capstone: drone | 2.44 GHz | wideband video-link detection |

Plus the **Exam** tab: ANFR-style questions (regulations + technical) with
spaced repetition, and a timed mock exam scored per domain — and a full
**electronic warfare & drones** section in the library.

## License

Code under Apache-2.0 (see `LICENSE`). Free forever; supported by donations.
