import type { Frame } from "./lib/useRf";
import type { LStr } from "./lib/i18n";
import type { IconName } from "./components/Icon";

export type Objective =
  | { kind: "observe" } // read the spectrum, then validate manually
  | { kind: "peak"; min_snr: number } // find a narrowband carrier
  | { kind: "burst" } // catch any transmission
  | { kind: "occupancy"; min: number } // a busy band
  | { kind: "drone" } // a wideband video link
  | { kind: "aircraft" }; // a decoded ADS-B aircraft

export type Mission = {
  id: string;
  icon: IconName;
  title: LStr;
  tagline: LStr;
  xp: number;
  band: { label: string; center_mhz: number; sample_rate_msps: number; gain_db: number };
  objective: Objective;
  goalText: LStr;
  /** The mission brief — what you're looking at and why. */
  bible: LStr[];
};

export const MISSIONS: Mission[] = [
  {
    id: "first-contact",
    icon: "radio",
    title: { fr: "Premier contact", en: "First contact" },
    tagline: {
      fr: "Lire un spectre, comprendre le bruit de fond",
      en: "Read a spectrum, understand the noise floor",
    },
    xp: 50,
    band: { label: "FM · 98 MHz", center_mhz: 98, sample_rate_msps: 8, gain_db: 32 },
    objective: { kind: "observe" },
    goalText: {
      fr: "Observe le spectre en direct, puis valide quand tu repères le bruit de fond.",
      en: "Watch the live spectrum, then validate once you can spot the noise floor.",
    },
    bible: [
      {
        fr: "Un récepteur SDR (comme le HackRF) transforme les ondes radio en chiffres. Le graphe que tu vois est le **spectre** : l'axe horizontal = la fréquence, l'axe vertical = la puissance en **dB** (échelle logarithmique).",
        en: "An SDR receiver (like the HackRF) turns radio waves into numbers. The graph you see is the **spectrum**: the horizontal axis is frequency, the vertical axis is power in **dB** (a logarithmic scale).",
      },
      {
        fr: "La ligne basse et bruitée, c'est le **bruit de fond** (noise floor) : l'énergie radio ambiante quand il n'y a aucun signal. Tout ce qui dépasse nettement au-dessus, c'est un **émetteur**.",
        en: "The low, fuzzy line is the **noise floor**: the ambient radio energy when nothing is transmitting. Anything that clearly rises above it is a **transmitter**.",
      },
      {
        fr: "Le récepteur est ici en **réception seule** : il écoute, il n'émet jamais. Régler le **gain** trop haut sature (tout monte), trop bas enterre les signaux dans le bruit.",
        en: "The receiver here is **receive-only**: it listens, it never transmits. Set the **gain** too high and everything saturates; too low and signals drown in the noise.",
      },
    ],
  },
  {
    id: "fm",
    icon: "wave",
    title: { fr: "Capter une radio FM", en: "Catch an FM station" },
    tagline: {
      fr: "Trouver une station, voir un signal large bande",
      en: "Find a station, see a wideband signal",
    },
    xp: 100,
    band: { label: "FM · 100.2 MHz", center_mhz: 100.2, sample_rate_msps: 8, gain_db: 32 },
    objective: { kind: "peak", min_snr: 18 },
    goalText: {
      fr: "Trouve un pic fort (SNR ≥ 18 dB) : c'est une station FM.",
      en: "Find a strong peak (SNR ≥ 18 dB): that's an FM station.",
    },
    bible: [
      {
        fr: "La radio FM commerciale vit entre **88 et 108 MHz**. Chaque station occupe ~**200 kHz** : sur le spectre c'est une bosse large et stable.",
        en: "Commercial FM radio lives between **88 and 108 MHz**. Each station occupies ~**200 kHz**: on the spectrum it's a broad, steady bump.",
      },
      {
        fr: "Le **SNR** (rapport signal/bruit) mesure de combien le signal dépasse le bruit de fond. Plus il est haut, plus la station est forte/proche.",
        en: "**SNR** (signal-to-noise ratio) measures how far a signal rises above the noise floor. The higher it is, the stronger or closer the station.",
      },
      {
        fr: "La FM module l'**information dans la fréquence** de la porteuse (d'où *Frequency Modulation*) — c'est ce qui la rend robuste au bruit d'amplitude.",
        en: "FM encodes the **information in the carrier's frequency** (hence *Frequency Modulation*) — that's what makes it robust against amplitude noise.",
      },
    ],
  },
  {
    id: "ism868",
    icon: "burst",
    title: { fr: "Bande ISM 868 (capteurs / LoRa)", en: "ISM 868 band (sensors / LoRa)" },
    tagline: { fr: "Surprendre des bursts de l'IoT", en: "Catch IoT bursts in the act" },
    xp: 150,
    band: { label: "868.3 MHz", center_mhz: 868.3, sample_rate_msps: 4, gain_db: 40 },
    objective: { kind: "burst" },
    goalText: {
      fr: "Patiente et capture un burst : un capteur qui transmet.",
      en: "Be patient and capture a burst: a sensor transmitting.",
    },
    bible: [
      {
        fr: "La bande **868 MHz (Europe)** est libre (ISM/SRD) : compteurs d'eau, capteurs, **LoRa**, télécommandes y vivent. Les objets y transmettent par **bursts** brefs puis se taisent (économie d'énergie + réglementation du *duty-cycle*).",
        en: "The **868 MHz band (Europe)** is licence-free (ISM/SRD): water meters, sensors, **LoRa**, remote controls all live here. Devices transmit in short **bursts** then go quiet (battery life + *duty-cycle* regulations).",
      },
      {
        fr: "Tu ne verras donc rien… puis soudain un pic apparaît et disparaît. C'est ça, l'IoT : intermittent par nature.",
        en: "So you'll see nothing… then suddenly a peak appears and vanishes. That's IoT: intermittent by nature.",
      },
      {
        fr: "On détecte ici la **présence** d'un burst (son énergie), pas son contenu — décoder LoRa (DevAddr, payload) est une autre paire de manches.",
        en: "Here we detect a burst's **presence** (its energy), not its content — decoding LoRa (DevAddr, payload) is a whole other story.",
      },
    ],
  },
  {
    id: "wifi24",
    icon: "wifi",
    title: { fr: "Le chaos du 2.4 GHz", en: "The 2.4 GHz chaos" },
    tagline: {
      fr: "WiFi, Bluetooth, micro-ondes : la cohue",
      en: "WiFi, Bluetooth, microwaves: the crowd",
    },
    xp: 150,
    band: { label: "2.44 GHz", center_mhz: 2440, sample_rate_msps: 20, gain_db: 40 },
    objective: { kind: "occupancy", min: 0.04 },
    goalText: {
      fr: "Observe une bande occupée (occupation ≥ 4 %).",
      en: "Observe a busy band (occupancy ≥ 4%).",
    },
    bible: [
      {
        fr: "Le **2.4 GHz** est la bande la plus encombrée : WiFi, Bluetooth, ZigBee, drones, fours micro-ondes… Le WiFi y utilise des canaux larges (~20–40 MHz) en **OFDM** (plein de sous-porteuses en parallèle).",
        en: "**2.4 GHz** is the most crowded band: WiFi, Bluetooth, ZigBee, drones, microwave ovens… WiFi uses wide channels (~20–40 MHz) with **OFDM** (many subcarriers in parallel).",
      },
      {
        fr: "L'**occupation** mesure la fraction du spectre au-dessus du seuil. Ici elle grimpe : tout le monde se marche dessus.",
        en: "**Occupancy** measures the fraction of the spectrum above threshold. Here it climbs: everyone is stepping on everyone.",
      },
      {
        fr: "Cette largeur de bande, c'est la clé de la mission suivante : un drone y cache son **lien vidéo**.",
        en: "That bandwidth is the key to the next mission: a drone hides its **video link** in here.",
      },
    ],
  },
  {
    id: "adsb",
    icon: "plane",
    title: { fr: "Radar ADS-B", en: "ADS-B radar" },
    tagline: {
      fr: "Décoder les avions : indicatif, altitude, position",
      en: "Decode aircraft: callsign, altitude, position",
    },
    xp: 250,
    band: { label: "1090 MHz · Mode S", center_mhz: 1090, sample_rate_msps: 8, gain_db: 40 },
    objective: { kind: "aircraft" },
    goalText: {
      fr: "Décode au moins un avion réel (indicatif, altitude ou position).",
      en: "Decode at least one real aircraft (callsign, altitude or position).",
    },
    bible: [
      {
        fr: "Tous les avions de ligne diffusent en clair leur position sur **1090 MHz** : c'est l'**ADS-B** (Mode S étendu). Chaque trame dure 120 µs : un préambule, puis 112 bits en **modulation de position d'impulsion** (PPM).",
        en: "Every airliner broadcasts its position in the clear on **1090 MHz**: that's **ADS-B** (extended Mode S). Each frame lasts 120 µs: a preamble, then 112 bits of **pulse-position modulation** (PPM).",
      },
      {
        fr: "Ici on ne se contente plus de *détecter* de l'énergie : le moteur Rust **démodule et décode** chaque trame (CRC-24, indicatif du vol, altitude, position CPR, vitesse). C'est la différence entre voir un signal et le *comprendre*.",
        en: "Here we no longer just *detect* energy: the Rust engine **demodulates and decodes** each frame (CRC-24, flight callsign, altitude, CPR position, speed). That's the difference between seeing a signal and *understanding* it.",
      },
      {
        fr: "La position utilise l'encodage **CPR** : il faut deux trames (paire/impaire) pour résoudre la position sans ambiguïté — regarde les avions apparaître dans la table dès qu'une paire arrive.",
        en: "Position uses **CPR** encoding: it takes two frames (even/odd) to resolve the position unambiguously — watch aircraft appear in the table as soon as a pair arrives.",
      },
    ],
  },
  {
    id: "drone",
    icon: "drone",
    title: { fr: "CAPSTONE — Détecter un drone", en: "CAPSTONE — Detect a drone" },
    tagline: {
      fr: "Repérer un lien vidéo OFDM large bande",
      en: "Spot a wideband OFDM video link",
    },
    xp: 300,
    band: { label: "2.44 GHz", center_mhz: 2440, sample_rate_msps: 20, gain_db: 40 },
    objective: { kind: "drone" },
    goalText: {
      fr: "Détecte une émission large bande (≥ 5 MHz) : la signature d'un drone.",
      en: "Detect a wideband emission (≥ 5 MHz): a drone's signature.",
    },
    bible: [
      {
        fr: "Les drones grand public (DJI OcuSync & co) maintiennent un **lien vidéo/contrôle large bande** en 2.4 GHz (souvent **≥ 5–10 MHz**). C'est bien plus large qu'un capteur, et ça saute en fréquence.",
        en: "Consumer drones (DJI OcuSync & co) maintain a **wideband video/control link** at 2.4 GHz (often **≥ 5–10 MHz**). That's far wider than a sensor, and it hops in frequency.",
      },
      {
        fr: "C'est exactement le détecteur Rust que tu as construit : repérer les **bursts large bande** au-dessus du bruit. Le WiFi peut aussi être large → en v1 c'est de la *présence*, pas une identification formelle.",
        en: "This is exactly the Rust detector you've been using: spotting **wideband bursts** above the noise. WiFi can be wide too → in v1 this is *presence*, not formal identification.",
      },
      {
        fr: "Pour aller plus loin : discriminer par le **saut de fréquence**, et décoder le **Remote ID** (WiFi/BT) qui donne l'ID du drone et la position du pilote.",
        en: "To go further: discriminate by **frequency hopping**, and decode **Remote ID** (WiFi/BT), which carries the drone's ID and the pilot's position.",
      },
    ],
  },
];

/** Is the current frame satisfying the mission objective right now? */
export function objectiveMet(m: Mission, f: Frame | null): boolean {
  if (!f) return false;
  const obj = m.objective;
  switch (obj.kind) {
    case "observe":
      return true; // any live frame counts; the user validates manually
    case "peak":
      return f.peaks.some((p) => !p.wideband && p.snr_db >= obj.min_snr);
    case "burst":
      return f.peaks.length > 0;
    case "occupancy":
      return f.occupancy >= obj.min;
    case "drone":
      return f.drone_suspected;
    case "aircraft":
      return (f.aircraft?.length ?? 0) > 0;
  }
}

export const levelFor = (xp: number) => Math.floor(xp / 250) + 1;
export const xpIntoLevel = (xp: number) => xp % 250;
