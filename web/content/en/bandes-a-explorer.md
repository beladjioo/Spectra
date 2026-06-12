# Interesting bands to explore

A treasure map for your SDR. (Frequencies vary by country — here, Europe.)

| Band | What | On screen |
|---|---|---|
| **88–108 MHz** | Commercial FM radio | wide (~200 kHz), stable stripes |
| **118–137 MHz** | Aviation (AM) | intermittent carriers, voice |
| **1090 MHz** | **ADS-B**: aircraft positions | very short, numerous bursts |
| **162 MHz** | **AIS**: ship positions | bursts |
| **137 MHz** | **NOAA APT**: weather-satellite imagery | slow sweep during a pass |
| **433 / 868 MHz** | **ISM**: sensors, remotes, LoRa | brief, intermittent bursts |
| **2.4 GHz** | WiFi, Bluetooth, drones | wide bands, frequency hopping |

For every target the approach is the same: the right [[antennes|antenna]], tune, [[waterfall]], identify the [[modulations|modulation]]. Some signals only need to be **detected** (presence), others can be **decoded** with a dedicated tool — see [[decoder-vs-detecter]].

The academy's missions train you on three of these bands:

> 👉 [ISM 868](#mission:ism868) · [The 2.4 GHz chaos](#mission:wifi24) · [Catch an FM station](#mission:fm)

## Going further: the hunting notebook

| Band | What | Why it's fascinating |
|---|---|---|
| **27 MHz** | Citizen Band | truckers — the licence-free ancestor of it all |
| **77.5 kHz** | DCF77 (German atomic clock) | the official time of millions of alarm clocks |
| **131–137 MHz** | ACARS | airliners' "text messages", decodable |
| **174–240 MHz** | DAB+ | digital radio, big OFDM blocks |
| **400–406 MHz** | **Weather radiosondes** | balloons at 30 km altitude — some people recover them on the ground! |
| **446 MHz** | PMR446 | licence-free walkie-talkies |
| **466 MHz** | POCSAG | hospital pagers, still alive |

Best hours: **ISM wakes up in daytime** (sensors, remotes), **HF opens in the evening** (propagation — see [[propagation]]), and **ADS-B never sleeps**.

**Responsible listening**: observe and learn — never disclose the content of private communications, even decodable ones. Re-read [[legal-securite]] before exploring.
