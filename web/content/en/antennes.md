# Antennas

The antenna is the first link in the chain — no DSP can rescue a badly captured signal. A simple rule: an antenna **resonates** when its size relates to the [[ondes-radio|wavelength]] of the target band.

The most common case is the **quarter-wave**: a whip of length `λ/4`. At 100 MHz (λ = 3 m) that's ~75 cm; at 868 MHz, ~8.6 cm; at 2.4 GHz, ~3 cm. That's why a long telescopic is perfect for FM but needlessly large for 2.4 GHz, where a short stub or a dedicated antenna does better.

Useful notions:
- **Gain & directivity**: a directional antenna (Yagi, patch) concentrates reception in one direction → better [[bruit-et-snr|SNR]] on a target, at the cost of having to aim it.
- **Polarisation**: vertical vs horizontal; a 90° mismatch between transmitter and receiver loses a lot of signal.
- **Matching (SWR)**: an antenna poorly matched to its band reflects energy instead of capturing it. An antenna "tuned" to the band = maximum transfer.

In practice: keep **one antenna per major band** and swap per mission. Place it high, in the clear, away from noise (power supplies, USB, screens).

Related: [[hackrf]] · [[bandes-a-explorer]]
