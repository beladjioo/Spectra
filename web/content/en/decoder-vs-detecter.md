# Detecting vs decoding

Two levels of ambition, not to be confused:

**Detecting (presence)** — answering "is there a signal, where, how wide, how strong?". That's what the academy's engine does: [[fft-spectre|FFT]] → floor → peaks. No need to know the protocol. Enough for: mapping a band, spotting interference, detecting a drone's *presence*, measuring occupancy.

**Decoding (content)** — extracting the **information**: demodulating, recovering the bits, the protocol, the message. Far more demanding: you need to know the [[modulations|modulation]], the sync, the coding, sometimes the cryptography.

Some classic, accessible decodes: FM audio (simple demodulation), ADS-B (aircraft), AIS (ships), NOAA imagery, and the large family of ISM sensors via dedicated tools.

**Why stop at detection so often?** Because it is:
- *generic* (works without knowing the protocol),
- *robust* (you don't need much SNR just to "see"),
- *honest* (a non-compliant drone won't decode, but its wideband energy still **detects**).

A project's next step is often: detect first, then add a targeted decoder for one specific band.

Related: [[bandes-a-explorer]] · [[workflow-live]]
