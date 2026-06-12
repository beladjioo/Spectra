# From I/Q to spectrum: the FFT

The raw [[iq|I/Q]] stream is unreadable as-is — a tide of numbers. To see *which frequencies* are present, we apply the **FFT** (Fast Fourier Transform): an algorithm that decomposes a block of samples into its frequency components.

Input: a block of N complex samples. Output: N **bins**, each representing a small slice of frequency and the **power** found there.

## Resolution: the central trade-off

A bin's width = `sample_rate / N`. This is *the* formula to remember:

| Sample rate | N (FFT size) | Bin width | You can tell apart… |
|---|---|---|---|
| 2 MSps | 2048 | ~1 kHz | two walkie-talkies 12.5 kHz apart |
| 8 MSps | 2048 | ~4 kHz | two neighbouring FM stations |
| 20 MSps | 4096 | ~5 kHz | WiFi channels inside 2.4 GHz |
| 2 MSps | 65536 | ~30 Hz | the fine lines of Morse or FT8 |

The bigger N, the finer the resolution — but each frame needs more samples and more computation: you trade **reactivity** for **detail**. A yardstick: at 2 MSps with N = 65536, each frame "consumes" 33 ms of signal; shorter bursts get diluted in it.

## The refinements that change everything

- **The window (Hann)**: brutally cutting a block of N samples creates "leakage" — every signal smears onto its neighbours. So the block is first multiplied by a smooth curve (the **Hann** window) that brings the edges to zero: peaks become clean and the floor crisp. Every serious analyser does it; this site's engine too.
- **Averaging**: a single FFT is "snowy" (noise fluctuates). Accumulate several FFTs before displaying: the noise smooths out, stable signals stand out. Its variant **max-hold** keeps the per-bin maximum — ideal to catch fleeting bursts.
- **fftshift**: bins are reordered to put the centre frequency… at the centre, with negative frequencies on the left. Without it, the spectrum displays "cut in half".

Each bin's power is then converted to [[decibels|dB]]. The result is the curve you see: horizontal axis = frequency, vertical axis = power. A signal = a bump above the [[bruit-et-snr|noise floor]].

## From spectrum to detector

This is exactly the heart of the site's engine (Rust on the server, TypeScript in your browser): Hann window → FFT → averaging → dB → floor estimation → anything above `floor + threshold` becomes a **peak** with its frequency, width and [[bruit-et-snr|SNR]]. It's also what spots a drone: a 10 MHz-wide "peak" looks like nothing else.

A single FFT = one photo. Stack them over time and you get the [[waterfall]].

## Your turn

1. 8 MSps, N = 2048: bin width? (~3.9 kHz.)
2. You're hunting a 50 ms LoRa burst. Giant N or max-hold averaging? (Max-hold — a giant N would dilute the burst.)
3. Why does the Hann window make the floor "cleaner"? (It removes the spectral leakage from block edges, which otherwise drowns neighbouring bins.)
