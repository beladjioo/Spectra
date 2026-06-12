# Noise floor, SNR and sensitivity

Plug a receiver into nothing: you still see a low, restless line. That's the **noise floor** — the random energy that is always there. No signal can be read *below* this floor.

## Where does the noise come from?

- **Thermal**: electron agitation in every conductor. Incompressible — it's physics (−174 dBm/Hz at room temperature, the "floor of floors").
- **The receiver itself**: every stage adds its own; this degradation is summarised by the **noise figure** — a few dB for a good LNA.
- **The environment**: switch-mode supplies, screens, USB cables, routers, LEDs… In town, this *man-made* noise vastly dominates thermal noise on most bands. That's the one you can fight.

## SNR: the only measure that matters

A signal is only useful if it **rises above** the floor. The gap between the two is the **SNR** (Signal-to-Noise Ratio), in dB:

`SNR = signal_power_dB − floor_dB`

| SNR | What you get |
|---|---|
| < 6 dB | barely detectable presence, nothing usable |
| 6–12 dB | reliable detection, robust modes decode (ADS-B, FT8) |
| 12–20 dB | decent FM listening, comfortable decoding |
| 20–35 dB | clean local station, crisp audio |
| > 35 dB | very close transmitter — watch for saturation |

A nearby FM station can peak +40 dB above the floor; a distant sensor barely +6 dB. This is the number the console's "Signals heard" panel shows you live.

## Two levers (and one trap)

- **Raise the signal**: a better [[antennes|antenna]], better placed ([[reglage-antenne]]), or get closer.
- **Lower the noise**: move the SDR away from interference sources (shielded USB extension), switch off suspect power supplies, filter.
- **The trap**: raising the [[hackrf|gain]] creates no SNR. Gain amplifies signal *and* noise; its only job is to lift both above the receiver's own noise. Too much gain → saturation → SNR goes *down*.

## Sensitivity and dynamic range

A receiver's **sensitivity** is the smallest signal it can pull out of the noise. Its **dynamic range** is the gap between the weakest and the strongest it can handle *at the same time* without saturating — crucial when a powerful transmitter sits next to a weak one (8 bits ≈ 48 dB, see [[echantillonnage]]).

This site's detector applies exactly that logic: it estimates the floor (≈ 20th percentile of the bins) then keeps only what exceeds `floor + threshold`.

## Your turn

1. Floor at −85 dB, FM peak at −52 dB: SNR? (33 dB — crisp listening.)
2. Unplugging the external monitor drops your floor by 6 dB. What did you gain? (+6 dB of SNR on *every* signal — the equivalent of a 4× better antenna, for free.)
3. Gain maxed out: floor rises 20 dB and the peak rises 20 dB too. SNR gained? (Zero — and you're courting saturation.)

> 👉 Measure a station's SNR: [Catch an FM station](#mission:fm)

Related: [[decibels]] · [[fft-spectre]] · [[reglage-antenne]]
