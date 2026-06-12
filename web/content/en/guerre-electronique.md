# Electronic warfare: reading the spectrum as terrain

**Electronic warfare** (EW) covers everything that happens in the radio spectrum once it becomes contested in a conflict. The same spectrum you explore with an SDR — FM, [[bandes-a-explorer|ISM]], 2.4 GHz, radars — is, on an operational theatre, disputed ground: each side tries to *see* the other in it, to *blind* them, and to *protect* its own links.

> This note is **educational and conceptual**. It explains publicly known principles (detection, jamming, countermeasures) to make sense of current events and the physics involved — not to build a jammer, which is illegal and dangerous ([[legal-securite]]).

## The three pillars

Classic doctrine splits EW into three functions:

| Pillar | NATO term | In plain words | SDR link |
|---|---|---|---|
| **Electronic support** | ES (ESM) | *listen*: detect, locate, identify emissions | exactly what an SDR receiver does, only more sensitive |
| **Electronic attack** | EA (ECM) | *act*: jam, decoy, saturate | transmitting — forbidden outside a military context |
| **Electronic protection** | EP (ECCM) | *resist*: frequency hopping, spreading, directivity | the design of robust waveforms |

A consumer SDR does *only* the first pillar, and only in **receive-only** mode.

## Electronic support: seeing without being seen

Listening to an adversary's spectrum reveals a great deal without ever transmitting:

- **Emission detection**: a radar, a radio, a drone link betrays itself the moment it transmits. It's the principle you use when spotting a peak above the [[bruit-et-snr|noise floor]].
- **Direction finding (DF)**: with several antennas or a directional one, you estimate the **direction** a signal arrives from. Crossing two bearings gives a position (triangulation).
- **Fingerprinting / SIGINT**: an emitter's "signature" (frequency, bandwidth, modulation, hop pattern) lets you **identify** and catalogue it. Seeing a signal ([[decoder-vs-detecter|detecting]]) and understanding it (decoding) are two different levels.

It is silent, passive and undetectable — which is exactly its value.

## Electronic attack: jamming and decoying

Jamming means drowning the useful signal under noise or a deceptive higher-power signal in the target band. Conceptually:

- **Barrage jamming**: flood a whole band with noise → simple but power-hungry and conspicuous.
- **Spot/follower jamming**: concentrate energy on the exact frequency in use → efficient, but you must first *find* it (back to electronic support).
- **Spoofing**: instead of noise, transmit a *fake* but plausible signal. The best-known example is **GNSS (GPS) spoofing**: a counterfeit positioning signal, stronger than the genuine satellites (very weak at ground level), makes a receiver compute a wrong position.

All of this requires **transmitting**, so it belongs strictly to the military domain and is forbidden to civilians.

## Electronic protection: making a link resistant

On the defensive side, waveforms are designed to be hard to jam or intercept:

- **Frequency hopping (FHSS)**: the link changes frequency tens to thousands of times per second following a sequence only the correspondents know. Jamming becomes a game of hide-and-seek. Bluetooth is a civilian version.
- **Spread spectrum (DSSS)**: the signal is spread below the noise floor; without the spreading code it is almost invisible. This is how GPS and "LPI/LPD" (low probability of intercept/detection) links work.
- **Directional antennas & nulling**: aim a narrow beam at the wanted signal and steer a "null" toward the jammer.
- **Band agility**: hop to a whole different band (2.4 → 5.8 GHz) when one is saturated.

These ideas explain why modern links (drones, military, but also WiFi) are so hard to disrupt cleanly.

## Why it matters today

Recent conflicts have made EW a decisive factor: ubiquitous drones, GNSS jamming over entire regions, a constant arms race between jammers and agile links. The drone side is detailed in [[drones-champ-bataille]].

Related: [[drones-champ-bataille]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[legal-securite]]
