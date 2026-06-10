# I/Q samples

An SDR doesn't store a simple stream of values: each sample is a **pair** of numbers, I (in-phase) and Q (quadrature). Together they form a **complex** number `I + jQ`, which you can picture as a point in a plane: its **distance from the origin** = the signal's amplitude, its **angle** = its phase.

Why complicate life? Because with a single real value you can't tell a frequency *above* the centre frequency from one *below* it — both would measure the same. With I and Q, the angle rotates one way or the other depending on the side: you recover the **negative frequencies**, hence the whole window, centred on the tuning frequency.

This is what lets you observe, say, ±10 MHz **around** 2.44 GHz in one go. The receiver "mixes" the band you care about down around zero, then samples it as I/Q.

Concretely, a HackRF's raw stream is a sequence `I,Q,I,Q,…`. The academy's engine reads that complex stream, applies an [[fft-spectre|FFT]], and gets the spectrum. Everything else (peaks, [[bruit-et-snr|SNR]], waterfall) follows from it.

Related: [[echantillonnage]] · [[fft-spectre]]
