# Noise floor, SNR and sensitivity

Hook a receiver up to nothing: you still see a low, restless line. That's the **noise floor** — the random thermal energy that's always present, plus the noise added by the receiver itself. No signal can be read *below* that floor.

A signal is only useful if it **rises above** the floor. The gap between the two is the **SNR** (Signal-to-Noise Ratio), in dB:

`SNR = signal_power_dB − floor_dB`

The higher the SNR, the cleaner and easier the signal is to decode. A nearby FM station can peak +40 dB above the floor; a distant sensor barely +6 dB.

Two levers to improve SNR:
- **Raise the signal**: a better [[antennes|antenna]], better aimed, or get closer.
- **Lower the noise**: set the [[hackrf|gain]] wisely (mind the saturation trap), move away from interference sources.

A receiver's **sensitivity** is the smallest signal it can still pull out of the noise. Its **dynamic range** is the gap between the weakest and strongest it can handle without saturating — crucial when a powerful transmitter sits next to a weak one.

The academy's detector uses exactly this idea: it sets the floor (≈ 20th percentile of the points) then keeps only what exceeds `floor + threshold`.

> 👉 Measure a station's SNR: [Catch an FM station](#mission:fm)

Related: [[decibels]] · [[fft-spectre]]
