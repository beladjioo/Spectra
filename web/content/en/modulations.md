# Modulation: writing information onto a wave

A bare [[ondes-radio|carrier]] says nothing. **Modulating** means varying one of its properties to the rhythm of the information. Three candidate properties: **amplitude**, **frequency**, **phase**.

**Analogue**
- **AM** (amplitude): the information modulates the carrier's height. Simple, but sensitive to amplitude noise. (AM radio, aviation)
- **FM** (frequency): the information modulates the frequency. Robust against noise → FM radio quality. In the [[waterfall]], an FM station is a wide (~200 kHz), stable stripe.

**Digital** — we transmit **symbols** (bits):
- **ASK / OOK**: switch the carrier on/off. Many 433 MHz remote controls.
- **FSK**: hop between two (or more) frequencies. Many [[bandes-a-explorer|ISM]] sensors; LoRa is a cousin (chirps).
- **PSK**: encode the information in the **phase** (which is why [[iq|I/Q]] samples, which measure phase, matter).
- **OFDM**: hundreds of subcarriers in parallel → high throughput, a **wideband** signal. That's WiFi, and drones' video links.

**Recognising by eye**: bandwidth, stability, temporal pattern and frequency hopping in the waterfall often tell you *what kind* of signal you're looking at — before any decoding.

> 👉 Spot a wideband OFDM signature: [Capstone — detect a drone](#mission:drone)
