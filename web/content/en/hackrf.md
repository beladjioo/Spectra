# The HackRF One

The HackRF One is a highly versatile SDR — the Swiss-army knife of spectrum exploration.

| Characteristic | Value | What it means |
|---|---|---|
| Coverage | **1 MHz → 6 GHz** | from AM radio to 5 GHz WiFi, a huge window |
| Sample rate | up to **20 MSps** | ~20 MHz observed at once (see [[echantillonnage]]) |
| Resolution | **8 bits** | modest dynamic range (~48 dB) → gain needs care |
| Duplex | **half-duplex** | it transmits *or* receives, never both — here, **receive-only** |
| Connector | SMA female | + external clock ports (CLKIN/CLKOUT) for synchronisation |
| Power | USB bus | a short, good-quality cable avoids many mysteries |

## The gain chain: three knobs, one goal

| Stage | Range | Role | Suggested starting point |
|---|---|---|---|
| **RF amp** | 0 or +14 dB | input boost | **off** (only as a last resort) |
| **LNA** (IF) | 0–40 dB, steps of 8 | amplifies at the antenna side | 16–24 dB |
| **VGA** (baseband) | 0–62 dB, steps of 2 | adjusts before the sampler | 20–30 dB |

**The method**: start low, raise the LNA until your signals rise out of the [[bruit-et-snr|noise floor]], fine-tune with the VGA — and **back off as soon as the whole floor rises** or "ghost" peaks appear: that's **saturation**, and a saturated receiver invents signals that don't exist. On 8 bits, slightly too low beats slightly too high.

In this site's interface, the single slider distributes LNA/VGA for you — but knowing what it drives will help you in any other SDR software.

## Known traps (and their fixes)

- **The centre spike (DC spike)**: a peak pinned exactly at the tuning frequency, whatever you do. A [[sdr-architecture|direct-conversion]] artefact, not a signal — offset by a few hundred kHz to study a precise frequency.
- **Overwhelming city FM**: broadcast transmitters can saturate the whole front end even when tuned elsewhere. Lower the LNA, or add an FM band-stop filter (~$15).
- **USB noise**: shielded extension, away from hubs and screens; the HackRF is sensitive to its electrical surroundings.
- **Static electricity**: the input isn't protected against strong discharges — no outdoor antenna without protection, and touch grounded metal before the SMA connector.

## Software side

- **In the browser (this site)**: Chrome/Edge drive the HackRF over **WebUSB** — click "Plug in my SDR" in the console. The serial number shows once connected.
- **Command line**: `hackrf_info` confirms firmware and serial number.
- **On a server/Pi**: through **SoapySDR** (`driver=hackrf`), the same API everywhere.

It needs an [[antennes|antenna]] matched to the target band — the bundled ANT500 is a compromise, and the [[reglage-antenne|tuning guide]] will help you get the most out of it.

## Your turn

1. The noise floor just jumped 15 dB across the whole window. Diagnosis? (Saturation — lower the LNA.)
2. Why leave the RF amp off by default? (+14 dB *before* any filtering: it saturates first, especially in town.)
3. What difference will you see between 8 and 20 MSps on the FM band? (An 8 vs 20 MHz window — more stations visible, but more machine load.)

> 👉 Confirm it responds: [First contact](#mission:first-contact)
