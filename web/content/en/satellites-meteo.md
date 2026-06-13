# Weather-satellite images (coming soon)

> **Chapter under construction.** The goal is ambitious and deserves doing properly — here's the promise and the theory already.

This is **the** turning point for many SDR beginners: receiving, with a makeshift antenna and a $30 dongle, the **image from a real satellite** passing overhead. Not abstract data — a *photo* of the clouds, taken at 800 km altitude, streamed down live.

## What makes it magic (and doable)

The polar-orbiting **NOAA** weather satellites (15, 18, 19) transmit **APT** (Automatic Picture Transmission) on **137 MHz** — right within an [[materiel-debuter|RTL-SDR]]'s reach. The signal is slow, robust, designed in the 70s to be decoded with almost nothing.

- **Modulation**: a 2400 Hz audio subcarrier, amplitude-modulated, itself FM on the carrier. Demodulate as wide FM, recover an audio signal, and **each pixel's brightness** is that subcarrier's amplitude.
- **Cadence**: 2 lines per second. A full pass lasts ~15 minutes and yields an image strip thousands of km long.
- The Russian successor **Meteor-M** transmits **LRPT** (digital, QPSK): colour image, prettier, a touch more demanding.

## The real challenge: knowing *when* to look up

A polar-orbiting satellite is only visible for a few minutes, during a **pass**. So you must **predict** its passes from its orbital parameters (the **TLEs**, *Two-Line Elements*, published and updated regularly) and your position. That brick — pass prediction + Doppler tracking — is what needs the most work, and why this chapter comes after the others.

## The antenna is everything

Polarisation is **circular** (the satellite spins): a plain vertical receives it poorly. The classics:
- **V-dipole** (two ~52 cm legs in a 120° V), simple and effective.
- **QFH antenna** (quadrifilar helix), the omnidirectional reference for 137 MHz.

## In the meantime

You can prepare everything already: understand the [[modulations|modulation]], tune your [[reglage-antenne|antenna]], master the [[waterfall]] to recognise the APT signal (a scrolling "ladder"). When the pass decoder is ready, you'll be set.

Related: [[bandes-a-explorer]] · [[modulations]] · [[reglage-antenne]] · [[propagation]]
