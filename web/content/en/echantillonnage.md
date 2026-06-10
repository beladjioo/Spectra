# Sampling, Nyquist and aliasing

An SDR turns the analogue wave into **numbers**: it measures the signal very fast, at regular intervals. That's **sampling**, and its pace is the **sample rate** (samples per second, Sps — often MSps).

The **Nyquist** theorem sets the golden rule: to faithfully represent a band of width *B*, you must sample at least at **2·B**. In other words, a 20 MSps sample rate gives you an observation window about **20 MHz** wide around the centre frequency (thanks to the [[iq|I/Q]] sample trick).

If a signal exceeds that limit, it doesn't disappear: it **folds back** into your window at a false position. That's **aliasing** — a ghost that looks like a real signal but isn't there. SDRs limit this with an analogue filter before the sampler, but it remains a classic trap: a peak that moves "the wrong way" when you retune is often an alias.

Practical consequence: the **sample rate sets the width** you observe at once. Wide (20 MSps) = an overview of a crowded band like 2.4 GHz; narrow (2–4 MSps) = a detailed zoom and less CPU/USB load.

> 👉 See the effect of bandwidth: [The 2.4 GHz chaos](#mission:wifi24)

Next: [[iq]] — why samples are *complex* numbers.
