import type { Frame } from "./lib/useRf";

export type Objective =
  | { kind: "observe" } // read the spectrum, then validate manually
  | { kind: "peak"; min_snr: number } // find a narrowband carrier
  | { kind: "burst" } // catch any transmission
  | { kind: "occupancy"; min: number } // a busy band
  | { kind: "drone" }; // a wideband video link

export type Mission = {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  xp: number;
  band: { label: string; center_mhz: number; sample_rate_msps: number; gain_db: number };
  objective: Objective;
  goalText: string;
  /** The "bible" — what you're looking at and why. */
  bible: string[];
};

export const MISSIONS: Mission[] = [
  {
    id: "first-contact",
    icon: "📡",
    title: "Premier contact",
    tagline: "Lire un spectre, comprendre le bruit de fond",
    xp: 50,
    band: { label: "FM · 98 MHz", center_mhz: 98, sample_rate_msps: 8, gain_db: 32 },
    objective: { kind: "observe" },
    goalText: "Observe le spectre en direct, puis valide quand tu repères le bruit de fond.",
    bible: [
      "Un récepteur SDR (comme le HackRF) transforme les ondes radio en chiffres. Le graphe que tu vois est le **spectre** : l'axe horizontal = la fréquence, l'axe vertical = la puissance en **dB** (échelle logarithmique).",
      "La ligne basse et bruitée, c'est le **bruit de fond** (noise floor) : l'énergie radio ambiante quand il n'y a aucun signal. Tout ce qui dépasse nettement au-dessus, c'est un **émetteur**.",
      "Le HackRF est ici en **réception seule** : il écoute, il n'émet jamais. Régler le **gain** trop haut sature (tout monte), trop bas enterre les signaux dans le bruit.",
    ],
  },
  {
    id: "fm",
    icon: "📻",
    title: "Capter une radio FM",
    tagline: "Trouver une station, voir un signal large bande",
    xp: 100,
    band: { label: "FM · 100.2 MHz", center_mhz: 100.2, sample_rate_msps: 8, gain_db: 32 },
    objective: { kind: "peak", min_snr: 18 },
    goalText: "Trouve un pic fort (SNR ≥ 18 dB) : c'est une station FM.",
    bible: [
      "La radio FM commerciale vit entre **88 et 108 MHz**. Chaque station occupe ~**200 kHz** : sur le spectre c'est une bosse large et stable.",
      "Le **SNR** (rapport signal/bruit) mesure de combien le signal dépasse le bruit de fond. Plus il est haut, plus la station est forte/proche.",
      "La FM module l'**information dans la fréquence** de la porteuse (d'où *Frequency Modulation*) — c'est ce qui la rend robuste au bruit d'amplitude.",
    ],
  },
  {
    id: "ism868",
    icon: "📶",
    title: "Bande ISM 868 (capteurs / LoRa)",
    tagline: "Surprendre des bursts de l'IoT",
    xp: 150,
    band: { label: "868.3 MHz", center_mhz: 868.3, sample_rate_msps: 4, gain_db: 40 },
    objective: { kind: "burst" },
    goalText: "Patiente et capture un burst : un capteur qui transmet.",
    bible: [
      "La bande **868 MHz (Europe)** est libre (ISM/SRD) : compteurs d'eau, capteurs, **LoRa**, télécommandes y vivent. Les objets y transmettent par **bursts** brefs puis se taisent (économie d'énergie + réglementation du *duty-cycle*).",
      "Tu ne verras donc rien… puis soudain un pic apparaît et disparaît. C'est ça, l'IoT : intermittent par nature.",
      "On détecte ici la **présence** d'un burst (son énergie), pas son contenu — décoder LoRa (DevAddr, payload) est une autre paire de manches.",
    ],
  },
  {
    id: "wifi24",
    icon: "🌐",
    title: "Le chaos du 2.4 GHz",
    tagline: "WiFi, Bluetooth, micro-ondes : la cohue",
    xp: 150,
    band: { label: "2.44 GHz", center_mhz: 2440, sample_rate_msps: 20, gain_db: 40 },
    objective: { kind: "occupancy", min: 0.04 },
    goalText: "Observe une bande occupée (occupation ≥ 4 %).",
    bible: [
      "Le **2.4 GHz** est la bande la plus encombrée : WiFi, Bluetooth, ZigBee, drones, fours micro-ondes… Le WiFi y utilise des canaux larges (~20–40 MHz) en **OFDM** (plein de sous-porteuses en parallèle).",
      "L'**occupation** mesure la fraction du spectre au-dessus du seuil. Ici elle grimpe : tout le monde se marche dessus.",
      "Cette largeur de bande, c'est la clé de la mission suivante : un drone y cache son **lien vidéo**.",
    ],
  },
  {
    id: "drone",
    icon: "🚁",
    title: "CAPSTONE — Détecter un drone",
    tagline: "Repérer un lien vidéo OFDM large bande",
    xp: 300,
    band: { label: "2.44 GHz", center_mhz: 2440, sample_rate_msps: 20, gain_db: 40 },
    objective: { kind: "drone" },
    goalText: "Détecte une émission large bande (≥ 5 MHz) : la signature d'un drone.",
    bible: [
      "Les drones grand public (DJI OcuSync & co) maintiennent un **lien vidéo/contrôle large bande** en 2.4 GHz (souvent **≥ 5–10 MHz**). C'est bien plus large qu'un capteur, et ça saute en fréquence.",
      "C'est exactement le détecteur Rust que tu as construit : repérer les **bursts large bande** au-dessus du bruit. Le WiFi peut aussi être large → en v1 c'est de la *présence*, pas une identification formelle.",
      "Pour aller plus loin : discriminer par le **saut de fréquence**, et décoder le **Remote ID** (WiFi/BT) qui donne l'ID du drone et la position du pilote.",
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
  }
}

export const levelFor = (xp: number) => Math.floor(xp / 250) + 1;
export const xpIntoLevel = (xp: number) => xp % 250;
