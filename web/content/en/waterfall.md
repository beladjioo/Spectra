# The waterfall (time cascade)

The spectrum alone shows only the present instant. The **waterfall** adds **time**: each new FFT becomes a coloured horizontal line (colour = the power at each frequency), and lines scroll downward. You read frequency in X, time in Y.

## The bestiary: learning to read shapes

It's the most powerful tool for *understanding* a signal, because it reveals its **behaviour over time**:

```
 frequency →                          what it is
 ┃                                    stable carrier
 ┃          ▌ ▌    ▌                  intermittent bursts (sensors, LoRa)
 ┃         ╱  ╱   ╱                   diagonal chirps (LoRa)
 ┃      ▖ ▘▗  ▘ ▖ ▗ ▘                 frequency hopping (Bluetooth)
 ┃   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                  wide grainy block (WiFi/OFDM, drone)
 ↓ time
```

- A **continuous vertical line** = a stable carrier (an FM station, a beacon).
- **Short, spaced dashes** = intermittent **bursts** ([[bandes-a-explorer|ISM]] sensors, remote controls).
- **Brief diagonals** = **LoRa** chirps.
- **Dots hopping** across the band = **frequency hopping** (Bluetooth, some drones).
- A **wide, fuzzy band** = a wideband signal like WiFi/OFDM or a drone video link.

## Setting the scale: where everything is decided

The choice of **palette** and scale (min/max in dB) changes everything: well set, a weak signal leaps out; badly set, it drowns.

- **Min**: pin it just below the [[bruit-et-snr|noise floor]]. Too low and everything is dark, you lose contrast; too high and you erase weak signals.
- **Max**: just above your strongest peak. The min–max gap is your "contrast window".
- On this site the scale adjusts automatically around the current floor and peak — in other software (SDR++, GQRX), taming this manual setting is the first skill to learn.

## The three-question reading method

1. **Width?** Narrow (kHz) = voice/telemetry; medium (100–200 kHz) = FM broadcast/LoRa; very wide (MHz) = OFDM, video.
2. **Continuity?** Permanent = broadcast/beacon; periodic = sensor (count the seconds between bursts!); erratic = human activity.
3. **Motion?** Fixed frequency = assigned channel; slow drift = cheap oscillator or Doppler (satellites!); jumps = FHSS.

With those three answers you can **recognise a [[modulations|modulation]] by eye** before decoding anything. A sensor's period, a satellite's Doppler drift, a drone's signature: it's all in this drawing.

## Your turn

1. A fine line shows for 1 s exactly every 60 s. Hypothesis? (A fixed-period sensor — meter, weather station.)
2. A line drifts slowly downward over 10 minutes. Hypothesis? (Doppler from a passing satellite, or a warming oscillator.)
3. The whole waterfall is bright orange. First reflex? (Badly pinned scale or too much gain — reframe min/max before concluding.)

> 👉 Watch a live waterfall in any mission, e.g. [Catch an FM station](#mission:fm)
