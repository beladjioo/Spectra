# Antennas

The antenna is the first link in the chain — no DSP can rescue a badly captured signal. A simple rule: an antenna **resonates** when its size relates to the [[ondes-radio|wavelength]] of the target band.

The most common case is the **quarter-wave**: a whip of length `λ/4`. At 100 MHz (λ = 3 m) that's ~75 cm; at 868 MHz, ~8.6 cm; at 2.4 GHz, ~3 cm. That's why a long telescopic is perfect for FM but needlessly large for 2.4 GHz, where a short stub or a dedicated antenna does better.

Useful notions:
- **Gain & directivity**: a directional antenna (Yagi, patch) concentrates reception in one direction → better [[bruit-et-snr|SNR]] on a target, at the cost of having to aim it.
- **Polarisation**: vertical vs horizontal; a 90° mismatch between transmitter and receiver loses a lot of signal.
- **Matching (SWR)**: an antenna poorly matched to its band reflects energy instead of capturing it. An antenna "tuned" to the band = maximum transfer.

In practice: keep **one antenna per major band** and swap per mission. Place it high, in the clear, away from noise (power supplies, USB, screens).

## Which antenna for what?

| Type | Typical gain | Pattern | Best for |
|---|---|---|---|
| λ/2 dipole | 2.15 dBi | omni (⊥ plane) | starting out: FM, airband |
| λ/4 ground plane | ~2 dBi | omni | fixed station, ISM |
| Telescopic whip | varies | omni | multi-band exploration |
| Discone | ~2 dBi | omni, **very wideband** | scanner listening 25 MHz–1.3 GHz |
| Yagi | 7–15 dBi | directional | DX, signal hunting, satellites |
| Collinear | 5–8 dBi | flattened omni | ADS-B (1090 MHz), repeaters |

## λ/4 cheat sheet (element length)

| Band | Frequency | λ/4 |
|---|---|---|
| FM | 100 MHz | 75 cm |
| Aviation | 125 MHz | 60 cm |
| 2 m | 145 MHz | 52 cm |
| ISM 433 | 433 MHz | 17.3 cm |
| ISM 868 | 868 MHz | 8.6 cm |
| ADS-B | 1090 MHz | 6.9 cm |
| WiFi | 2440 MHz | 3.1 cm |

Placement golden rule: **height beats gain**. An average antenna, high and in the clear, beats an excellent antenna at the back of a room — and keep it away from switch-mode supplies, screens and USB cables that pollute the [[bruit-et-snr|floor]].

Related: [[hackrf]] · [[bandes-a-explorer]] · [[materiel-debuter]]
