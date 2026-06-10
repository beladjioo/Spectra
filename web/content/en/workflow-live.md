# Using it live: the method

An operator's reflex, to repeat every session:

1. **Check the hardware.** SDR detected (`hackrf_info`), the right [[antennes|antenna]] for the band, antenna in the clear.
2. **Tune wide first.** Sit at the centre of the band with a wide [[echantillonnage|sample rate]] to see the whole picture, then zoom (narrower sample rate) on what interests you.
3. **Set the [[hackrf|gain]].** Raise it until signals rise out of the [[bruit-et-snr|floor]]; back off as soon as the whole floor rises (saturation).
4. **Read the [[waterfall]] before concluding.** The time dimension separates a stable carrier from a burst, a frequency hopper, or a wideband signal.
5. **Identify before decoding.** Width, stability, pattern → what kind of [[modulations|modulation]]? Many analyses (usefully) stop at **presence detection**, with no decoding.
6. **Beware of ghosts.** A peak moving the wrong way when you retune is often an **alias** (see [[echantillonnage]]) or saturation, not a real signal.

The academy automates steps 2–3 per mission (each mission tunes the radio for you) and trains your eye on steps 4–5.

> 👉 Get in position: [First contact](#mission:first-contact)
