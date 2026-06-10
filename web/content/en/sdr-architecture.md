# What is an SDR?

A **software-defined radio** moves into software what a classic radio does with dedicated circuits. The hardware shrinks to: an antenna, a stage that brings the desired band down to a low frequency, and an **analogue-to-digital converter** that [[echantillonnage|samples]] it. Everything else — filtering, demodulating, decoding — becomes code.

The key stage is the **mixer**: it multiplies the received signal by a reference frequency (the local oscillator) to **translate** the band of interest down around zero. That's how you "tune": changing the centre frequency means changing that oscillator. The academy's engine does it on the fly whenever a mission sends a tune command.

The huge advantage: **one box, a thousand uses**. The same chip listens to FM, aviation, IoT, drones — you just change the software. The drawback: quality depends on the hardware (noise, linearity, dynamic range) and on the CPU for the [[fft-spectre|DSP]].

Common families: RTL-SDR (very cheap, receive-only, ~2.4 MHz of bandwidth), HackRF (huge coverage, half-duplex), FPGA-based SDRs (Pluto, USRP) for very high throughput.

Yours is the [[hackrf]].
