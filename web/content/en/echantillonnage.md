# Sampling, Nyquist and aliasing

An SDR turns the analogue wave into **numbers**: it measures the signal very fast, at regular intervals. That's **sampling**, and its pace is the **sample rate** (samples per second, Sps — usually MSps).

## The golden rule: Nyquist

The **Nyquist** theorem sets the limit: to faithfully represent a band of width *B*, you must sample at least at **2·B**. Thanks to [[iq|I/Q]] (complex) samples, the rule gets even simpler for an SDR: **sample rate = width of the observed window**. 20 MSps → you see ~20 MHz around the centre frequency.

| Sample rate | Window | Typical use | USB throughput |
|---|---|---|---|
| 2 MSps | 2 MHz | one FM station, ADS-B, fine zoom | 4 MB/s |
| 4 MSps | 4 MHz | the whole 868 ISM band | 8 MB/s |
| 8 MSps | 8 MHz | a good slice of the FM band | 16 MB/s |
| 20 MSps | 20 MHz | the 2.4 GHz chaos, drone hunting | 40 MB/s |

Wide = overview but more CPU/USB load and a higher *apparent* per-bin noise floor; narrow = detailed zoom and a relaxed machine. The right reflex: **wide to search, narrow to study**.

## Aliasing: the spectrum's ghost

If a signal exceeds the window it doesn't vanish: it **folds back** inside, at a false position. That's **aliasing** — a ghost that looks like a real signal but isn't there.

Concrete example: an 8 MHz window centred on 100 MHz (96–104 MHz). A strong transmitter at 105 MHz, poorly filtered, can reappear mirrored near 103 MHz — where nobody is transmitting.

SDRs limit this with an analogue **anti-aliasing filter** before the sampler (the HackRF sets one automatically at ~75% of the sample rate). But it remains a classic trap. Tell-tale signs of an alias:

- the peak **moves the wrong way** when you change the centre frequency;
- it moves **twice as fast** as the others;
- it disappears when you **widen** the sample rate.

## And what about bits?

Each measurement is coded on a finite number of bits — that's **quantisation**. A HackRF codes on **8 bits**: 256 levels, i.e. a theoretical dynamic range of about **48 dB** between the smallest and the largest signal measurable *at the same time*. A 12-bit SDR (Airspy, SDRplay) gains ~24 dB: it tolerates a strong transmitter without crushing the weak one next door. That's why [[hackrf|gain]] setting matters so much on an 8-bit receiver: it places your 48 dB window at the right floor of the building.

## Your turn

1. You want to watch the whole FM band (88–108 MHz) at once. Minimum sample rate? (20 MSps, centred on 98 MHz.)
2. At 2.4 MSps, how many bytes per second does an RTL-SDR output? (2.4 M × 2 = 4.8 MB/s.)
3. A peak slides left as you tune right. Real signal or alias? (Alias — or saturation; lower the gain to settle it.)

> 👉 See bandwidth in action: [The 2.4 GHz chaos](#mission:wifi24)

Next: [[iq]] — why samples are *complex* numbers.
