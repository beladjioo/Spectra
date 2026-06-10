# Transmitter and receiver

**The superheterodyne receiver.** The reigning architecture. The idea: instead of filtering/amplifying directly at the received frequency (hard, and it varies), first **translate** the signal to a fixed **intermediate frequency (IF)**, where good filters and amplifiers can be built.

Typical chain:
1. **Antenna → input filter** (selects the band, see [[circuits-resonance-filtres]]).
2. **Mixer**: multiplies the signal by a tunable **local oscillator (LO)** → produces the IF. Tuning the set = changing the LO.
3. **IF filter**: provides **selectivity** (keep only the wanted channel).
4. **Amplification + demodulation** ([[modulations]]) → audio or data.

This is exactly the principle your [[sdr-architecture|SDR]] applies, except the last part is done in software.

**Mixing traps.** The mixer also creates an **image frequency** (on the other side of the LO) that must be rejected by filtering, otherwise two different stations overlap.

**The transmitter** runs the path in reverse: a stable oscillator generates the carrier, a stage **modulates** it with the information, filters remove **harmonics** and **spurious** emissions (a regulatory obligation — see [[reglementation]]), then a power amplifier drives the [[antennes|antenna]] through the [[lignes-ros-adaptation|feed line]].

Related: [[composants-electroniques]] · [[modulations]]
