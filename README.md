# OpenHertz — learn radio by doing it, with a real SDR

> A gamified "SDR handbook": plug in an **RTL-SDR (~$30)** or a **HackRF**, or use
> the built-in simulator, and progress mission by mission — read a spectrum,
> catch an FM station (demodulated live in your browser), surprise a LoRa burst,
> survive the 2.4 GHz chaos, **decode aircraft over ADS-B**, and detect a drone.
> All-**Rust** DSP engine; React UI; a bilingual (FR/EN) Obsidian-style library;
> built-in **amateur-radio exam** preparation.

**100% free and open source.** Passive, **receive-only** — the SDR only ever
listens; nothing is transmitted. Development is funded entirely by voluntary
[donations on Ko-fi](https://ko-fi.com/spectrarf).

## Why

- **RF is intimidating.** Classic SDR tools throw a wall of knobs at you.
  OpenHertz is a guided, gamified path from "what's a dB?" to "I just decoded an
  airliner."
- **Real decoding, not just detection.** The engine demodulates FM (50 µs
  de-emphasis included) and decodes Mode S/ADS-B (CRC-24, global CPR position) —
  and now does it **entirely in the browser** via WebUSB + a TypeScript DSP, so
  there's no server to run.
- **It always works.** With no hardware, a built-in simulator takes over: the app
  demos itself, is tested in CI, and runs as a fully functional free site.
- **Bilingual, exam-focused.** Curriculum, Obsidian-style library (wikilinks,
  backlinks) and ANFR-style quiz in both French and English — a niche no one else
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
   Raspberry Pi 5 homelab (k3s + ArgoCD), ideal for fixed/white-zone installs.
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
│   ├── content/{fr,en}/  # the bilingual knowledge base (markdown, wikilinks)
│   └── src/quiz.ts       # ANFR-style question bank
├── server/               # optional Rust backend (axum + tokio + rustfft + soapysdr)
│   ├── src/dsp.rs        # spectral analysis + FM demod (unit-tested)
│   └── src/adsb.rs       # full Mode S/ADS-B decoder (tested against known vectors)
├── apps/ & clusters/     # k8s + ArgoCD GitOps for the Pi 5 appliance
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

## Deployment

The site is a Cloudflare Worker that serves the pre-rendered static build (the
`ASSETS` binding) and collects product events at `POST /e`. Build with
`npm run build` (which also pre-renders every route for SEO) and deploy from
`web/` with `npx wrangler deploy`. The custom domain `openhertz.org` is wired in
`web/wrangler.jsonc`. See `docs/GO-LIVE.md` for the homelab/Cloudflare
architecture and `docs/DOMAIN.md` for the domain setup.

## Analytics & observability

Privacy-first — no cookies, no PII, no fingerprinting. Three dashboards:

**1. Cloudflare Web Analytics** (visits, countries, referrers, Core Web Vitals).
Easiest path: in the Cloudflare dashboard → *Web Analytics* → add `openhertz.org`;
because the zone is proxied, the cookieless beacon is injected at the edge with
zero code. (Alternatively set `VITE_CF_BEACON=<token>` at build time and the app
injects the beacon itself — see `web/src/main.tsx`.)

**2. Workers Logs** (requests, errors, `console` output). Enabled via
`observability` in `web/wrangler.jsonc`. Read them in the dashboard under
*Workers & Pages → rf-academy → Logs*, or stream live with `npx wrangler tail`.

**3. Product events → Workers Analytics Engine.** The Worker (`web/worker/index.js`)
writes named events to the `openhertz_events` dataset. The client fires them via
`navigator.sendBeacon` (`web/src/lib/analytics.ts`): `page_view`,
`mission_started` / `mission_completed` (mission id), `note_read` (slug),
`sdr_connected` (rtl/hackrf), `sim_session` / `live_session`, `exam_started` /
`exam_passed`, `donate_click`. Query with the Analytics Engine SQL API
(`POST https://api.cloudflare.com/client/v4/accounts/<account_id>/analytics_engine/sql`,
`Authorization: Bearer <API token with Account Analytics:Read>`). The schema:
`blob1`=event, `blob2`=detail (mission/note/driver), `blob3`=locale, `blob4`=country,
`blob5`=source.

```sql
-- where do learners drop off? funnel over the last 7 days
SELECT blob1 AS event, count() AS n
FROM openhertz_events
WHERE timestamp > now() - INTERVAL '7' DAY
GROUP BY event ORDER BY n DESC;
```
```sql
-- what fraction of sessions ever connect real hardware?
SELECT
  countIf(blob1 = 'sdr_connected') AS connected,
  countIf(blob1 = 'sim_session') AS sim_sessions
FROM openhertz_events
WHERE timestamp > now() - INTERVAL '30' DAY;
```
```sql
-- which notes precede the most donate clicks (read engagement → support)
SELECT blob2 AS note, count() AS reads
FROM openhertz_events
WHERE blob1 = 'note_read' AND timestamp > now() - INTERVAL '30' DAY
GROUP BY note ORDER BY reads DESC LIMIT 15;
```

## License

Code under Apache-2.0 (see `LICENSE`). Free forever; supported by donations.
