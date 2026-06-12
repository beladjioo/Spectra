# What is an SDR?

A **Software Defined Radio** moves into software what a classic radio does with dedicated circuits. The hardware shrinks to the bare minimum; everything else — filtering, demodulating, decoding — becomes code.

```
 antenna                                            software
   │    ┌─────┐   ┌───────────┐   ┌──────┐   ┌─────┐   ┌──────────────┐
   └───→│ LNA │──→│   mixer   │──→│filter│──→│ ADC │──→│ FFT · demod  │
        └─────┘   └───────────┘   └──────┘   └─────┘   │ decoding     │
       amplifies   shifts the      anti-     samples   └──────────────┘
       w/o noise   band to 0       alias     as I/Q      your CPU
                        ↑
                  local oscillator
                  (= the tuning knob)
```

## The stages, one by one

- **LNA** (Low-Noise Amplifier): amplifies the whisper caught by the antenna while adding as little noise as possible. Every dB of noise added here is lost forever.
- **Mixer + local oscillator**: multiplies the signal by a reference frequency to **shift** the band of interest down to zero. "Tuning" the radio = changing that oscillator. When a mission tunes the radio, this is the setting it sends.
- **Anti-aliasing filter**: cuts whatever spills outside the window before digitisation (see [[echantillonnage]]).
- **ADC**: the analogue-to-digital converter samples as [[iq|I/Q]]. From here on, everything is numbers.

## Two architectures to know

- **Direct conversion** (HackRF, RTL-SDR…): a single mix, straight to zero. Simple and compact, but it leaves a signature: the famous **centre spike** ("DC spike") visible exactly at the tuning frequency — an artefact, not a signal. Reflex: offset by a few hundred kHz when studying a precise signal.
- **Superheterodyne**: one or more intermediate frequencies before baseband. More components, but better image rejection — the architecture of high-end communications receivers.

## The huge advantage… and the trade-off

**One box, a thousand uses.** The same chip listens to FM, aviation, IoT, drones — just change the software. The trade-off: quality depends on the hardware (noise, linearity, ADC [[echantillonnage|bits]]) and on the CPU available for [[fft-spectre|DSP]].

## The common families

| SDR | Price | Coverage | Max bandwidth | Bits | Best for |
|---|---|---|---|---|---|
| RTL-SDR v3/v4 | ~$35 | 24–1766 MHz | 2.4 MHz | 8 | starting out, ADS-B, FM, ISM |
| HackRF One | ~$330 | 1 MHz–6 GHz | 20 MHz | 8 | all-terrain, 2.4 GHz, wideband |
| Airspy Mini | ~$130 | 24–1700 MHz | 6 MHz | 12 | VHF/UHF listening quality |
| SDRplay RSP1B | ~$130 | 1 kHz–2 GHz | 10 MHz | 14 | HF + VHF finesse |
| ADALM-Pluto | ~$270 | 325 MHz–3.8 GHz | 20 MHz | 12 | experimentation, transmit (licence!) |

Yours is the [[hackrf]] — and the reasoned buying guide lives in [[materiel-debuter]].

## Your turn

1. You see a peak pinned exactly at centre, whatever the tuning. Signal or artefact? (DC spike — a direct-conversion artefact.)
2. Why is the LNA the most critical component in the chain? (The noise it adds is amplified by every following stage — it sets the sensitivity.)
