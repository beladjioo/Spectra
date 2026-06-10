# From IQ to spectrum: the FFT

The raw [[iq|I/Q]] stream is unreadable as-is — a tide of numbers. To see *which frequencies* are present, we apply the **FFT** (Fast Fourier Transform): an algorithm that breaks a block of samples into its frequency components.

Input: a block of N complex samples (here N = 4096). Output: N **bins**, each representing a small slice of frequency and the **power** found there. A bin's width = `sample_rate / N`. At 20 MSps and N = 4096, each bin is ≈ 5 kHz: that's the spectrum's **resolution**. The bigger N, the finer the resolution (but the slower it gets).

Two refinements the engine applies:
- **Averaging**: several FFTs are accumulated before display, smoothing the noise and making stable signals stand out.
- **fftshift**: bins are reordered to put the centre frequency… in the centre, with negative frequencies on the left.

Power is then converted to [[decibels|dB]]. The result is the curve you see: horizontal axis = frequency, vertical axis = power. A signal = a bump above the [[bruit-et-snr|floor]].

This is exactly the heart of the academy's Rust engine (`server/src/dsp.rs`) — and it's also what spots a drone.

One FFT = one snapshot. Stack them over time and you get the [[waterfall]].
