# Electronic components

The building blocks you'll find in every radio schematic.

**Passive**
- **Resistor** (R, in ohms): limits current, creates a voltage drop. See [[electricite]].
- **Capacitor** (C, in farads): stores energy in an electric field, **blocks DC** and passes AC ever more easily as frequency rises. Its opposition to current, the **reactance**, is `Xc = 1/(2πfC)` — it falls as f rises.
- **Inductor / coil** (L, in henries): stores energy in a magnetic field, **passes DC** and opposes AC more strongly as frequency rises: `XL = 2πfL` — it grows with f.

Capacitor and inductor thus behave in **opposite** ways versus frequency: that's what makes filters and tuned circuits possible ([[circuits-resonance-filtres]]).

**Active (semiconductors)**
- **Diode**: conducts in one direction only. Uses: rectification (power supplies), detection, protection. Useful variants: Zener diode (voltage reference), LED, varicap (voltage-controlled capacitance).
- **Transistor** (bipolar or FET): controls a large current/voltage from a small signal → that's **amplification** and **switching**. The heart of transmit/receive stages.

Related: [[electricite]] · [[emetteur-recepteur]]
