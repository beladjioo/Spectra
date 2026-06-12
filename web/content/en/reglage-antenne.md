# Tuning your antenna, step by step

The theory lives in [[antennes]]; here we **act**. Goal: start from a standard telescopic whip and get the best possible reception on the band you're listening to — measured, not guessed.

## 1. The right length

A quarter-wave antenna receives best when the whip is a quarter of the [[ondes-radio|wavelength]], shortened by about 5% (the wave "slows down" in metal — velocity factor):

```
L (cm) ≈ 7125 / f (MHz)
```

| Band | Frequency | Whip length | Telescopic? |
|---|---|---|---|
| FM radio | 100 MHz | **71 cm** | almost fully extended |
| Airband (voice) | 125 MHz | **57 cm** | three quarters out |
| 2 m amateur | 145 MHz | **49 cm** | two thirds out |
| ISM 433 | 433 MHz | **16.5 cm** | 2–3 segments |
| ISM 868 (LoRa, sensors) | 868 MHz | **8.2 cm** | just the first segment |
| ADS-B (aircraft) | 1090 MHz | **6.5 cm** | first segment, or a dedicated antenna |
| 2.4 GHz (WiFi, drones) | 2440 MHz | **2.9 cm** | too short — use a dedicated antenna |

Remember the gesture: **frequency up → antenna shorter**. A fully extended telescopic on 868 MHz receives *worse* than one pulled out 8 cm: too long, it's simply out of tune.

## 2. Placement (often more important than length)

- **High and in the clear**: near a window; better, outside. Walls and reinforced concrete eat UHF.
- **Vertical**: almost everything you'll listen to (local FM, airband, ISM, ADS-B) is vertically polarised. A horizontal whip halves your signal.
- **Away from noise**: switch-mode power supplies, screens, USB hubs and routers pollute the [[bruit-et-snr|noise floor]] for several metres. A shielded USB extension that moves the SDR away from the PC is the best value upgrade there is.
- **A ground plane helps**: a magnetic-base antenna sitting on a metal plate (tin box, car roof, radiator) completes the quarter wave and easily gains a few dB.

## 3. Measure instead of believing

Open the **Explore** console and use the "Signals heard" panel:

1. Tune to the target band (preset or manual frequency).
2. Note the **SNR** of the strongest signal.
3. Change *one thing only* (length, position, orientation), wait two seconds, read the SNR again.
4. Keep whichever configuration wins. Repeat.

Reference points: **< 10 dB** is painful listening, **15–25 dB** is comfortable, **> 25 dB** excellent. If the *whole* spectrum jumps at once, that's not better reception — that's too much gain saturating the receiver; see [[workflow-live]].

## 4. Quick troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Nothing rises above the noise | gain too low, antenna unplugged | raise gain in steps, check the connector |
| Very high noise floor | USB/power-supply interference nearby | move the SDR away, shielded extension, ferrites |
| Strong station but choppy audio | saturation (gain too high) | lower the gain until the floor is flat |
| Good FM, bad 868 MHz | antenna too long for the band | shorten to ~8 cm or swap antennas |
| Repeating ghost signals | images (overloaded front end) | lower the gain, move away from strong transmitters |

## 5. Going further

When you want purpose-built antennas (V-dipole for satellites, ADS-B collinear, directional Yagi), matching and SWR theory is in [[lignes-ros-adaptation]], and hardware choices in [[materiel-debuter]].

Related: [[antennes]] · [[workflow-live]] · [[bandes-a-explorer]]
