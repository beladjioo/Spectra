# POCSAG: the paging that won't die

We thought they vanished with the 90s, but **pagers** are still here — for a good reason. Where a mobile network saturates or fails, a **POCSAG** message broadcast by a powerful transmitter gets through everywhere, instantly, to thousands of receivers at once. Hospitals, firefighters, emergency services and industry still rely on it.

## What you can pick up, and what you can't

In Europe, paging often lives around **466 MHz** — right within an [[materiel-debuter|RTL-SDR]]'s reach. It's **POCSAG**, a 1982 protocol:

- **FSK modulation**: the information hops between two close frequencies (typically ±4.5 kHz). On the [[waterfall]], a **narrow burst** (~16 kHz) appears, lasts a fraction of a second, then goes quiet.
- **Rates** 512, 1200 or 2400 baud. Simple structure: a preamble, "batches" of 32-bit words with error correction (BCH).

OpenHertz deliberately stops at **presence detection**: spotting the burst, not reading the message. Decoding POCSAG in the clear potentially exposes **personal data** — medical calls, contact details, operational alerts. Receiving a wave is one thing; exploiting its content is another, legally very different ([[legal-securite]]).

## Detecting ≠ decoding (again, always)

Same honesty principle as for [[decoder-vs-detecter|drones]]: seeing that "something is happening" at 466 MHz is easy and harmless. Going further engages your responsibility. The mission lets you **watch paging live** on the spectrum — the exciting, legal part.

## Recognising a paging burst

- **Regularity**: bursts often come grouped, at intervals, when a broadcast cycle goes out.
- **Width**: ~12–20 kHz, far narrower than a WiFi channel, wider than a pure carrier.
- **Sound** (if you demodulate it as narrow FM): a characteristic "modem" rasp, like an old fax.

> 👉 Catch paging in action: [POCSAG pagers](#mission:pocsag)

Related: [[modulations]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[legal-securite]]
