# Radio waves

A radio wave is an electromagnetic field that oscillates and travels at the speed of light. Two quantities describe it:

- **Frequency** *f*: the number of oscillations per second, in hertz (Hz). FM radio sits around 100 **megahertz** (MHz, millions of Hz), WiFi around 2.4 **gigahertz** (GHz, billions of Hz).
- **Wavelength** *λ*: the distance travelled during one oscillation. You convert between the two with `λ = c / f` (c ≈ 3×10⁸ m/s). At 100 MHz, λ ≈ 3 m; at 2.4 GHz, λ ≈ 12.5 cm.

Wavelength isn't just a curiosity: it dictates **antenna size** (see [[antennes]]) and how the wave passes through or bends around obstacles. Low frequencies penetrate walls better; high frequencies carry less far but move more data.

The radio **spectrum** is simply the set of all these frequencies, carved into bands by regulation (FM, aviation, ISM, telephony…). A HackRF covers 1 MHz to 6 GHz: an enormous window onto that spectrum.

A "bare" wave at a single frequency (a **carrier**) carries no information. For that, you **modulate** it — see [[modulations]].

> 👉 See a real carrier for the first time: [First contact](#mission:first-contact)

## The map of the spectrum

| Range | Frequencies | λ | What lives there |
|---|---|---|---|
| LF / MF | 30 kHz – 3 MHz | km | AM radio, beacons, the DCF77 clock |
| HF | 3 – 30 MHz | 100–10 m | shortwave, amateur DX |
| VHF | 30 – 300 MHz | 10–1 m | FM, aviation, the 2 m band, weather satellites |
| UHF | 300 MHz – 3 GHz | 1 m – 10 cm | 70 cm, ISM 433/868, ADS-B, GSM, GPS, 2.4 GHz WiFi |
| SHF | 3 – 30 GHz | cm | 5 GHz WiFi, radars, satellite links |

The higher you go: shorter antennas, line-of-sight range dominates, higher data rates — and walls get more opaque.

## Polarisation

The electric field oscillates in a plane: **vertical** (most mobile use) or **horizontal** (much TV/DX). A receiver crossed at 90° to the transmitter loses ≈ **20 dB** — if a known signal seems oddly weak, straighten your antenna first.

## Your turn

`λ = 300 / f(MHz)`. Work these out in your head: 433 MHz → ~69 cm; 1090 MHz → ~27.5 cm; 2440 MHz → ~12.3 cm. These orders of magnitude come back everywhere, from antennas to obstacles.

Next up: [[decibels]] to measure the power of these waves.
