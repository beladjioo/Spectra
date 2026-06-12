# What hardware should I start with?

Good news: software-defined radio has made listening to the spectrum **ridiculously affordable**. Here's the honest guide, with no useless gear.

## Option 1 — the RTL-SDR dongle (~$30–40): start here

A lighter-sized USB stick descended from DVB-T tuners. The reference: **RTL-SDR Blog V3 or V4** (avoid no-name clones — often noisy, no TCXO).

- Coverage **~500 kHz to 1766 MHz** (V3/V4 even receives HF via "direct sampling").
- **2.4 MSps**: a ~2.4 MHz window — plenty for FM, aviation, ISM, ADS-B.
- **Receive-only**: zero regulatory risk.
- Best of all: **it works right here** — *Explore* tab → "Plug in my SDR (USB)" (Chrome/Edge). Nothing to install, the browser drives it.

## Option 2 — the HackRF One (~$300–350): to go further

- Coverage **1 MHz to 6 GHz**: it sees 2.4 GHz (WiFi, drones), invisible to an RTL-SDR.
- **Up to 20 MSps**: windows ten times wider.
- **Can transmit** (half-duplex) — which is illegal without a licence: see [[legal-securite]]. The academy stays receive-only.
- It's the heart of OpenHertz's Pi appliance, and it also works here over WebUSB.

| | RTL-SDR V3/V4 | HackRF One |
|---|---|---|
| Price | ~$35 | ~$330 |
| Coverage | 0.5–1766 MHz | 1–6000 MHz |
| Width (MSps) | 2.4 | 20 |
| Transmit | no | yes (licence!) |
| First buy? | **yes** | once you know why |

## Your first antennas

The bundled antenna is a compromise. Soon you'll want: an **adjustable dipole** (the RTL-SDR Blog kit is excellent), a **magnetic λ/4** to stick on a car roof or radiator, and later one dedicated antenna per band — see [[antennes]].

## Setup per operating system

- **Windows**: run Zadig (zadig.akeo.ie), select the dongle, install the **WinUSB** driver. Required for WebUSB.
- **Linux**: a udev rule to allow non-root access, then replug:
  `echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="0bda", MODE="0666"' | sudo tee /etc/udev/rules.d/20-rtlsdr.rules && sudo udevadm control --reload`
  (for a HackRF, use idVendor `1d50`.)
- **macOS**: nothing to do.
- Then Chrome/Edge → *Explore* → **Plug in my SDR**.

## Traps to avoid

- $12 clones: frequency drift, noise, fake "R820T2". The V3/V4's **TCXO** genuinely matters (e.g. to stay locked on ADS-B).
- "Miracle" wideband antennas with fantasy gain figures.
- Buying a HackRF "for later" before exhausting what an RTL-SDR can teach — which is a lot.

> 👉 Hardware plugged in? Go check the noise floor: [First contact](#mission:first-contact)

Related: [[hackrf]] · [[antennes]] · [[bandes-a-explorer]]
