# Feed lines, SWR and matching

Between the transceiver and the [[antennes|antenna]] sits the **transmission line** (most often coaxial cable). It has a **characteristic impedance** — typically **50 Ω** in amateur radio.

**Impedance matching.** Energy transfer is maximal when the source, the line and the antenna present **the same impedance** (50 Ω). If the antenna isn't matched, part of the energy is **reflected** back towards the transmitter instead of being radiated.

**SWR.** This defect is measured as the **Standing Wave Ratio**, read on an **SWR meter**:
- **SWR = 1:1** → perfect match, no reflection.
- **SWR = 2:1** → still acceptable.
- **High SWR** → a lot of reflected energy: losses, and a risk to the transmitter's power stage.

To correct it, insert an **antenna tuner**, which brings the seen impedance back to 50 Ω.

**Losses & symmetry.** A long cable and a high frequency increase **line losses**. To connect an unbalanced cable (coax) to a balanced antenna (dipole), use a **balun**, which keeps the coax shield from radiating (common-mode currents).

On the receive side (your case with an SDR), a good match directly improves the [[bruit-et-snr|SNR]].

Related: [[antennes]] · [[circuits-resonance-filtres]]
