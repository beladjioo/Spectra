# Resonant circuits and filters

Pair an inductor [[composants-electroniques|L]] with a capacitor C: at one particular frequency, their opposite reactances become equal and the circuit **resonates**. That's the **resonant frequency**:

`f₀ = 1 / (2π·√(L·C))`

Worth memorising: to **raise** the tuned frequency, **decrease** L or C; to lower it, increase them. That's exactly how a set "tunes in" to a station.

**Quality factor Q**: it measures the "sharpness" of the resonance. High Q = a narrow, selective peak (you isolate one frequency well); low Q = a broad response. Q also describes losses: the lower the losses, the higher the Q.

**Filters** — combine R, L, C to pass some frequencies and block others:
- **Low-pass**: passes low frequencies, cuts high ones.
- **High-pass**: the opposite.
- **Band-pass**: passes only a range (a resonant circuit is one).
- **Band-stop / notch**: removes a specific range (useful against a jammer).

In radio, filters are everywhere: selecting a band, removing harmonics on transmit, cleaning a signal on receive. A receiver's selectivity depends directly on its filters — see [[emetteur-recepteur]].

Related: [[composants-electroniques]] · [[fft-spectre]]
