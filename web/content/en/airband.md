# The airband (aviation AM)

Between **118 and 137 MHz** lives one of the most rewarding bands for a beginner: the **airband**, aviation's voice communications. Control towers, approach, pilots, weather ATIS — all in the clear, all in **AM**, and entirely within reach of a plain [[materiel-debuter|RTL-SDR]].

## Why AM and not FM?

[[modulations|FM]] dominates consumer radio, but aviation stayed on **AM** (amplitude modulation) for a **safety** reason:

- If two stations transmit at once on the same channel, AM lets you hear **both** (with a tell-tale heterodyne whistle). FM's capture effect would erase one — an aircraft might never know it was stepped on.
- AM is simple and rugged: an AM receiver fails "gracefully".

Each channel is only **~8.33 kHz** wide (modern spacing): on the spectrum, a **thin, brief line**, not the broad steady bump of an FM station.

## How it's demodulated

AM carries the information in the carrier's **amplitude**. To demodulate = follow that amplitude:

1. Isolate the channel (filter around the frequency).
2. Compute the **envelope**: `√(I² + Q²)` at each instant (see [[iq]]).
3. Remove the DC component (the carrier itself) — what remains *is* the voice.
4. A little AGC (automatic gain) levels loud and faint transmissions.

That's exactly what OpenHertz does when you listen to an airband channel.

## A few frequencies to start

| Use | Frequency | Note |
|---|---|---|
| Aeronautical emergency | 121.500 MHz | the international "guard" |
| Tower / ground | 118–122 MHz | varies by airport |
| Approach / control | 119–135 MHz | regional sectors |
| ATIS (looped weather) | airport-specific | great for practice: it talks continuously |

> ⚠️ **Receive-only.** Listening to aviation is legal in many countries but not all, and **re-transmitting or exploiting** these communications is strictly regulated. See [[legal-securite]].

## Reception tips

- A vertical ~57 cm antenna (quarter wave at 125 MHz), well in the clear, works wonders ([[reglage-antenne]]).
- Communications are **short and intermittent**: let it run, be patient, the waterfall helps you spot an active channel.
- Too far from an airport? ATIS and cruising aircraft (high altitude, huge line-of-sight range) are often still receivable.

> 👉 Start listening: [Listen to aviation (AM)](#mission:airband)

Related: [[modulations]] · [[bandes-a-explorer]] · [[reglage-antenne]] · [[legal-securite]]
