# Drones and the spectrum on the modern battlefield

In a few short years the small drone — from the consumer quadcopter to the loitering munition — has become a central actor in conflicts. And all of its effectiveness rests on the **radio spectrum**: a drone that can neither receive commands, nor send back video, nor locate itself is just a toy. That is why counter-drone work is, first and foremost, a matter of [[guerre-electronique|electronic warfare]].

> **Educational** note: it describes publicly known physical principles (which bands, how detection works, why jamming does or doesn't work). No operational instructions. Transmitting/jamming is forbidden to civilians ([[legal-securite]]).

## A drone's three radio links

A remotely piloted drone relies on three radio links, each on identifiable bands:

1. **Command & control (C2)**: uplink, pilot to drone. Often on **2.4 GHz** and **5.8 GHz** (the same [[bandes-a-explorer|ISM]] bands as your WiFi), using [[guerre-electronique|frequency hopping]] to resist jamming.
2. **Video downlink**: drone to pilot. Wideband (several MHz) — this is the **wideband signature** you learn to spot in the Capstone mission. Racing FPV drones often use analogue 5.8 GHz video; consumer drones a digital link (OcuSync-type).
3. **Navigation (GNSS)**: the drone listens to GPS/GLONASS/Galileo to position itself and hold a course. A very weak signal at ground level, hence **vulnerable to jamming and spoofing**.

Cutting *one* of these links is often enough to neutralise the drone — or to trigger its safety behaviour (return to home, land, hover).

## Detecting a drone by radio

Passive detection (receive-only, like an SDR) looks for the signatures of these links:

- **Wideband energy at 2.4 / 5.8 GHz**: the video downlink occupies a lot of spectrum — that is exactly the drone mission's objective ([[decoder-vs-detecter|detecting]] an emission ≥ 5 MHz).
- **Frequency-hopping pattern**: the C2 link hops at a recognisable cadence, different from household WiFi.
- **Remote ID**: in many countries drones must broadcast in the clear (often over WiFi/Bluetooth) an identifier and the position of both the drone *and* the pilot. It's a legally **decodable** signal, very useful for cooperative detection.
- **Model fingerprint**: bandwidth, frequencies and protocol often let you identify the drone's *type*.

Radio detection has a major advantage: it is **passive and silent**, and reaches beyond line of sight (the drone gives itself away before it's visible). It combines with radar, acoustics and optics to make the alert reliable.

## Neutralising: why it's hard

Countermeasures target the three links:

- **C2 jamming** → the drone loses its orders and triggers its failsafe.
- **GNSS jamming/spoofing** → the drone loses its position; spoofing can even make it drift.
- **Capture/takeover** → exploiting a protocol flaw (increasingly rare, as links are encrypted and agile).

But the adversary answers with **agility** ([[guerre-electronique|electronic protection]]): band hopping, resistant waveforms, and above all **autonomous** drones guided by camera and onboard AI that **no longer need a radio link** once launched — nothing to jam. That's the current frontier: when the drone stops talking, classic EW loses its grip, and the fight shifts to optics, acoustics and the kinetic interceptor.

## The race under way

Recent evolution comes down to a few trends:

- **ISM band saturation**: so many drones and jammers that 2.4 and 5.8 GHz become a permanent electromagnetic battlefield.
- **Area GNSS jamming**: whole regions where civilian GPS is unusable, with collateral effects on aviation and maritime navigation.
- **Fibre-optic drones**: tethered to the pilot by a wire several kilometres long — **no radio emission at all**, hence undetectable and unjammable by EW.
- **Autonomy and swarms**: AI guidance, optical terminal targeting, swarm coordination — shifting value from the radio link to onboard computation.

For a curious civilian, the concrete entry point remains the drone mission and listening to 2.4 GHz: there, in miniature and entirely legally, you see the same wideband-signature physics that structures this whole field.

Related: [[guerre-electronique]] · [[decoder-vs-detecter]] · [[bandes-a-explorer]] · [[modulations]] · [[legal-securite]]
