# Decibels (dB and dBm)

In radio, power levels span a colossal range: a strong signal can be a billion times more powerful than a weak one. To keep things readable, we work on a **logarithmic scale**: the decibel.

The **dB** expresses a *ratio* between two powers:

`dB = 10 · log₁₀(P₁ / P₂)`

A few landmarks worth memorising:
- **+3 dB** ≈ ×2 (double the power)
- **+10 dB** = ×10
- **−10 dB** = ÷10
- **+20 dB** = ×100

The **dBm** is an *absolute* dB, referenced to 1 milliwatt: 0 dBm = 1 mW, −30 dBm = 1 µW, −90 dBm = a very weak yet perfectly usable radio signal.

On your analyser, the spectrum's vertical axis is in dB. **Careful**: with a HackRF these values are *relative* (they depend on the [[antennes|gain]] you set) — excellent for *seeing* and *comparing* signals, but not a calibrated absolute dBm measurement.

What really matters is not the raw value but the **gap** between a signal and the floor: that's SNR — see [[bruit-et-snr]].

> 👉 Read the dB axis on a real spectrum: [First contact](#mission:first-contact)
