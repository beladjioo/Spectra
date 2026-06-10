# The HackRF One

The HackRF One is a very versatile SDR. Its key characteristics:

- **Coverage 1 MHz → 6 GHz**: from AM radio up to 5 GHz WiFi. An enormous window.
- **Up to 20 MSps**: an observation width of about 20 MHz at once (see [[echantillonnage]]).
- **Half-duplex**: it transmits *or* receives, never both at once. In the academy we stay **receive-only** — it never transmits.
- **8-bit** resolution: modest dynamic range. Hence the importance of setting the gain well.

Three adjustable **gains**, best understood as a chain:
- **LNA** (low-noise amplifier, antenna side): helps weak signals, but too high it saturates on strong ones.
- **VGA** (baseband stage gain): adjusts the level before the sampler.
- **RF amp** (+14 dB): a boost, to enable only when needed.

**The right setting**: raise the gain until your signals rise out of the [[bruit-et-snr|floor]], but **back off as soon as the whole floor rises** or "ghost" peaks appear — that's **saturation**. A saturated receiver invents signals that don't exist.

On the software side we talk to the HackRF through **SoapySDR** (`driver=hackrf`): the same API on your dev laptop and on the Pi 5. Check it's seen with `hackrf_info`.

It needs an [[antennes|antenna]] suited to the target band — the bundled one is a compromise.

> 👉 Confirm it responds: [First contact](#mission:first-contact)
