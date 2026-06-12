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

## The decibel cheat sheet

| dB | Power ratio | | dB | Ratio |
|---|---|---|---|---|
| +3 | ×2 | | −3 | ÷2 |
| +6 | ×4 | | −6 | ÷4 |
| +10 | ×10 | | −10 | ÷10 |
| +20 | ×100 | | −20 | ÷100 |
| +30 | ×1000 | | −30 | ÷1000 |

Everything combines by **addition**: +13 dB = +10 then +3 = ×20. That's the whole magic of the logarithm.

## dBm, dBi, dBd — three cousins not to confuse

- **dBm**: an absolute *power*, referenced to 1 mW (0 dBm = 1 mW; +30 dBm = 1 W).
- **dBi**: an *antenna gain*, referenced to the ideal isotropic antenna.
- **dBd**: the same gain referenced to a dipole — 0 dBd = **2.15 dBi** (a classic exam trap).

A chain example: transmitter +30 dBm → cable −3 dB → antenna +5 dBi ⇒ **EIRP ≈ +32 dBm**. You just add, nothing else.

## Your turn

Swapping antennas, your signal goes from −90 to −70 dBm. How many times more received power? (+20 dB → **×100**.)

> 👉 Read the dB axis on a real spectrum: [First contact](#mission:first-contact)
