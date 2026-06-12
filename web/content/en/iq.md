# I/Q samples

An SDR doesn't store a simple stream of values: each sample is a **pair** of numbers, I (in-phase) and Q (quadrature). Together they form a **complex** number `I + jQ`, which you can picture as a point in a plane: its **distance from the origin** = the signal's amplitude, its **angle** = its phase.

```
        Q ↑
          |      • (I=0.6, Q=0.8)
          |     /
          |    /  amplitude = √(I²+Q²) = 1.0
          |   /   phase     = atan2(Q, I) ≈ 53°
          |  /
   ───────+──────────→ I
          |
```

## Why two numbers instead of one?

With a single real value you cannot tell a frequency *above* the centre frequency from one *below* it — both would give exactly the same measurement. With I and Q, the point rotates in the plane: **counter-clockwise** = frequency above centre, **clockwise** = below. You recover the **negative frequencies**, hence the whole window, centred on the tuning frequency.

That's what lets you observe, say, ±10 MHz **around** 2.44 GHz in one go. The receiver "brings down" the band you care about around zero (the mixing stage, see [[sdr-architecture]]), then samples it as I/Q.

## The picture that makes it click: the spinning point

Picture the (I, Q) pair as the tip of a clock hand:

- The hand stands **still** → a signal exactly at the centre frequency (zero relative frequency).
- It spins **1000 times per second** → a signal at +1 kHz from centre.
- Its **length varies** with a voice → amplitude modulation (AM).
- Its **spin rate varies** with music → frequency modulation (FM).
- It **jumps abruptly in angle** → phase modulation (PSK).

Every kind of [[modulations|modulation]] can be read in this plane. It's also why digital receivers display **constellations**: for PSK, the points cluster into tight groups (4 groups = QPSK, i.e. 2 bits per symbol); if the clusters smear, the link is noisy.

## Concretely, inside the machine

A HackRF's raw stream is a byte sequence `I,Q,I,Q,…`, each **signed 8-bit** (−128 to +127); an RTL-SDR does the same unsigned. Practical consequences:

- **Throughput**: at 10 MSps that's 10 million pairs × 2 bytes = **20 MB/s** over USB. It's the sample rate, not the listening frequency, that costs.
- **Max amplitude**: a saturated sample "pins" at ±127 — on the spectrum, the whole [[bruit-et-snr|noise floor]] rises. You set the gain to stay below that.
- The engine reads this complex stream, applies an [[fft-spectre|FFT]], and gets the spectrum. Everything else (peaks, SNR, [[waterfall]]) follows from it.

## Your turn

1. A sample reads (I = −0.7; Q = 0). Amplitude? Phase? (0.7; 180°.)
2. The point completes one full turn every 2 ms, counter-clockwise. What relative frequency is the signal at? (+500 Hz above centre.)
3. Why does an 8-second I/Q recording at 2.4 MSps weigh ~38 MB? (2.4 M × 2 bytes × 8 s.)

Related: [[echantillonnage]] · [[fft-spectre]] · [[modulations]]
