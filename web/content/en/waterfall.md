# The waterfall

The spectrum alone shows only the present instant. The **waterfall** adds **time**: each new FFT becomes a coloured horizontal line (colour = power at each frequency), and the lines scroll downward. You read frequency on X, time on Y.

It's the most powerful tool for *understanding* a signal, because it reveals its **behaviour over time**:

- A **continuous vertical line** = a stable carrier (an FM station, a beacon).
- **Short, spaced dashes** = intermittent **bursts** ([[bandes-a-explorer|ISM]] sensors, LoRa, remote controls).
- **Patterns hopping in frequency** = **frequency hopping** (Bluetooth, some drones).
- A **wide, fuzzy band** = a wideband signal like WiFi/OFDM or a drone video link.

The choice of **colour palette** and scale (min/max in dB) changes everything: well set, a weak signal jumps out; badly set, it drowns. In the academy, the scale adjusts around the current [[bruit-et-snr|floor]] and peak.

With practice, you'll **recognise a modulation by eye** in the waterfall before ever decoding it — see [[modulations]].

> 👉 Watch a live waterfall in any mission, e.g. [Catch an FM station](#mission:fm)
