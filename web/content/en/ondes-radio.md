# Radio waves

A radio wave is an electromagnetic field that oscillates and travels at the speed of light. Two quantities describe it:

- **Frequency** *f*: the number of oscillations per second, in hertz (Hz). FM radio sits around 100 **megahertz** (MHz, millions of Hz), WiFi around 2.4 **gigahertz** (GHz, billions of Hz).
- **Wavelength** *λ*: the distance travelled during one oscillation. You convert between the two with `λ = c / f` (c ≈ 3×10⁸ m/s). At 100 MHz, λ ≈ 3 m; at 2.4 GHz, λ ≈ 12.5 cm.

Wavelength isn't just a curiosity: it dictates **antenna size** (see [[antennes]]) and how the wave passes through or bends around obstacles. Low frequencies penetrate walls better; high frequencies carry less far but move more data.

The radio **spectrum** is simply the set of all these frequencies, carved into bands by regulation (FM, aviation, ISM, telephony…). A HackRF covers 1 MHz to 6 GHz: an enormous window onto that spectrum.

A "bare" wave at a single frequency (a **carrier**) carries no information. For that, you **modulate** it — see [[modulations]].

> 👉 See a real carrier for the first time: [First contact](#mission:first-contact)

Next up: [[decibels]] to measure the power of these waves.
