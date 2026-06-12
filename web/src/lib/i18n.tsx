/* Bilingual core. Every piece of UI copy lives here as { fr, en }; structured
   content (missions, quiz, journey, notes) carries its own LStr fields and is
   resolved with the same t(). Locale persists and follows the browser on first
   visit. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "fr" | "en";
export type LStr = { fr: string; en: string };

const STORAGE = "rfa-locale";

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved === "fr" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({
  locale: "fr",
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, locale);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const { locale, setLocale } = useContext(Ctx);
  const t = (s: LStr) => s[locale];
  return { locale, setLocale, t };
}

/* ── UI copy catalogue ────────────────────────────────────────────────────── */

export const STR = {
  tagline: { fr: "écoute le monde invisible", en: "listen to the invisible world" },

  nav: {
    journey: { fr: "Voyage", en: "Journey" },
    explore: { fr: "Explorer", en: "Explore" },
    exam: { fr: "Examen", en: "Exam" },
    library: { fr: "Bibliothèque", en: "Library" },
  },

  status: {
    live: { fr: "en direct", en: "live" },
    sim: { fr: "simulateur", en: "simulator" },
    offline: { fr: "hors-ligne", en: "offline" },
    passive: { fr: "Réception seule", en: "Receive-only" },
    connecting: { fr: "Connexion au moteur RF…", en: "Connecting to the RF engine…" },
  },

  sdr: {
    detected: { fr: "détecté", en: "detected" },
    serial: { fr: "n° de série", en: "serial" },
    noSerial: { fr: "n° de série indisponible", en: "serial unavailable" },
    driver: { fr: "pilote", en: "driver" },
    none: { fr: "Aucun SDR détecté", en: "No SDR detected" },
    plugIn: {
      fr: "Branche un RTL-SDR (~30 €) ou un HackRF en USB — détection automatique. En attendant, tout fonctionne en simulateur.",
      en: "Plug in an RTL-SDR (~$30) or a HackRF over USB — detected automatically. Meanwhile, everything runs on the simulator.",
    },
    liveBadge: { fr: "EN DIRECT", en: "LIVE" },
    simBadge: { fr: "SIMULATEUR", en: "SIMULATOR" },
  },

  usb: {
    connect: { fr: "📡 Brancher mon RTL-SDR (USB)", en: "📡 Plug in my RTL-SDR (USB)" },
    disconnect: { fr: "Déconnecter le SDR", en: "Disconnect the SDR" },
    hint: {
      fr: "Chrome/Edge uniquement. Branche une clé RTL-SDR (~30 €) et le navigateur la pilote directement — le traitement se fait sur ta machine, rien ne quitte ton ordinateur.",
      en: "Chrome/Edge only. Plug in an RTL-SDR dongle (~$30) and the browser drives it directly — processing happens on your machine, nothing leaves your computer.",
    },
    active: {
      fr: "RTL-SDR branché en direct — le spectre que tu vois est réel (24–1766 MHz).",
      en: "RTL-SDR live — the spectrum you see is real (24–1766 MHz).",
    },
    error: { fr: "Connexion impossible :", en: "Could not connect:" },
    unsupported: {
      fr: "Ton navigateur ne gère pas WebUSB — utilise Chrome ou Edge pour brancher un SDR.",
      en: "Your browser doesn't support WebUSB — use Chrome or Edge to plug in an SDR.",
    },
  },

  hero: {
    over: { fr: "EN CE MOMENT, AU-DESSUS DE TOI", en: "RIGHT NOW, ABOVE YOU" },
    title1: { fr: "L'air est plein de signaux.", en: "The air is full of signals." },
    title2: { fr: "Apprends à les entendre.", en: "Learn to hear them." },
    sub: {
      fr: "Radios FM, avions, capteurs, satellites : tout parle en silence autour de toi. Pas besoin de connaissances — un parcours guidé, un vrai récepteur radio (ou notre simulateur), et la curiosité fait le reste.",
      en: "FM stations, aircraft, sensors, satellites: everything around you is talking in silence. No background needed — a guided journey, a real radio receiver (or our simulator), and curiosity does the rest.",
    },
    cta: { fr: "Commencer le voyage", en: "Begin the journey" },
    ctaContinue: { fr: "Reprendre le voyage", en: "Continue the journey" },
    ctaExplore: { fr: "ou explore librement →", en: "or explore freely →" },
    noise: { fr: "bruit de fond", en: "noise floor" },
    strongest: { fr: "signal le plus fort", en: "strongest signal" },
    occupancy: { fr: "occupation", en: "occupancy" },
    listening: { fr: "fréquence d'écoute", en: "listening at" },
  },

  journey: {
    title: { fr: "Le voyage", en: "The journey" },
    sub: {
      fr: "Cinq étapes, du tout premier dB jusqu'à la licence. Chaque étape mêle lecture, manipulation en direct et petites victoires.",
      en: "Five stages, from your very first dB to the licence. Each stage mixes reading, live hands-on and small wins.",
    },
    lesson: { fr: "leçon", en: "lesson" },
    mission: { fr: "mission", en: "mission" },
    checkpoint: { fr: "point d'étape", en: "checkpoint" },
    read: { fr: "lu", en: "read" },
    done: { fr: "fait", en: "done" },
    locked: {
      fr: "Termine l'étape précédente pour déverrouiller",
      en: "Finish the previous stage to unlock",
    },
    progress: { fr: "progression", en: "progress" },
    minutes: { fr: "min", en: "min" },
    start: { fr: "C'est parti", en: "Let's go" },
    chapterLabel: { fr: "Étape", en: "Stage" },
  },

  mission: {
    all: { fr: "← toutes les étapes", en: "← all stages" },
    theory: { fr: "Lire la théorie", en: "Read the theory" },
    objective: { fr: "Objectif", en: "Objective" },
    validated: { fr: "Mission validée", en: "Mission complete" },
    next: { fr: "Suivant →", en: "Next →" },
    observed: { fr: "J'ai repéré le bruit de fond ✓", en: "I spotted the noise floor ✓" },
    holding: { fr: "signal détecté… maintiens-le", en: "signal detected… hold it" },
    searching: { fr: "en recherche…", en: "searching…" },
    liveSpectrum: { fr: "Spectre en direct", en: "Live spectrum" },
    waterfall: { fr: "Cascade · le temps défile vers le bas", en: "Waterfall · time flows downward" },
    aircraft: { fr: "Avions décodés (ADS-B)", en: "Decoded aircraft (ADS-B)" },
    noise: { fr: "bruit", en: "noise" },
    peak: { fr: "pic", en: "peak" },
    occ: { fr: "occ", en: "occ" },
  },

  console: {
    vfo: { fr: "Fréquence d'accord", en: "Tuning frequency" },
    listenFm: { fr: "Écouter (démodulation FM)", en: "Listen (FM demodulation)" },
    stop: { fr: "Arrêter l'écoute", en: "Stop listening" },
    listenHint: {
      fr: "Idéal sur une station FM (88–108 MHz). Sans SDR, une tonalité de test confirme l'audio.",
      en: "Best on an FM station (88–108 MHz). Without an SDR, a test tone confirms the audio path.",
    },
    spectrum: { fr: "Spectre", en: "Spectrum" },
    waterfall: { fr: "Waterfall", en: "Waterfall" },
    presets: { fr: "Quartiers du spectre", en: "Spectrum neighbourhoods" },
    bandwidth: { fr: "Bande observée", en: "Observed bandwidth" },
    bandwidthHint: {
      fr: "MSps — largeur observée ≈ {n} MHz autour du centre.",
      en: "MSps — observed width ≈ {n} MHz around centre.",
    },
    gain: { fr: "Gain", en: "Gain" },
    gainHint: {
      fr: "Monte jusqu'à voir le signal ; redescends si tout le plancher monte (saturation).",
      en: "Raise it until the signal shows; back off if the whole floor rises (saturation).",
    },
    understand: { fr: "Comprendre", en: "Understand" },
    strongestPeak: { fr: "Pic le plus fort :", en: "Strongest peak:" },
    wide: { fr: "de large", en: "wide" },
    helpSpectrum: { fr: "lire le spectre", en: "reading the spectrum" },
    helpWaterfall: { fr: "le waterfall", en: "the waterfall" },
    helpGain: { fr: "le gain", en: "gain" },
    helpMod: { fr: "les modulations", en: "modulations" },
    helpBands: { fr: "quoi écouter", en: "what to listen to" },
  },

  presets: {
    fm: { fr: "Radio FM", en: "FM radio" },
    fmHint: { fr: "la musique qui t'entoure", en: "the music around you" },
    air: { fr: "Aviation (voix)", en: "Aviation (voice)" },
    airHint: { fr: "pilotes ↔ tours de contrôle", en: "pilots ↔ control towers" },
    adsb: { fr: "ADS-B avions", en: "ADS-B aircraft" },
    adsbHint: { fr: "les avions annoncent leur position", en: "aircraft announce their position" },
    ism: { fr: "ISM 868", en: "ISM 868" },
    ismHint: { fr: "capteurs et objets connectés", en: "sensors and IoT" },
    wifi: { fr: "2.4 GHz", en: "2.4 GHz" },
    wifiHint: { fr: "WiFi, Bluetooth, micro-ondes", en: "WiFi, Bluetooth, microwave ovens" },
  },

  library: {
    search: { fr: "rechercher…", en: "search…" },
    noResult: { fr: "aucun résultat", en: "no results" },
    mentioned: { fr: "Mentionné dans", en: "Mentioned in" },
    notFound: { fr: "# Note introuvable", en: "# Note not found" },
  },

  quiz: {
    title: { fr: "Préparation à l'examen radioamateur", en: "Amateur-radio exam preparation" },
    intro: {
      fr: "{n} questions type ANFR sur deux domaines (réglementation, technique), avec explications et liens vers la bibliothèque. La révision utilise la répétition espacée : les questions ratées reviennent vite, les acquises s'espacent.",
      en: "{n} ANFR-style questions across two domains (regulations, technical), with explanations and library links. Revision uses spaced repetition: missed questions come back fast, mastered ones spread out.",
    },
    acquired: { fr: "acquises", en: "mastered" },
    learning: { fr: "en cours", en: "learning" },
    fresh: { fr: "nouvelles", en: "new" },
    train: { fr: "Réviser", en: "Practise" },
    trainSub: {
      fr: "Questions une par une, correction immédiate et explication. Gratuit, illimité.",
      en: "One question at a time, instant feedback and explanation. Free, unlimited.",
    },
    exam: { fr: "Examen blanc", en: "Mock exam" },
    examSub: {
      fr: "Conditions réelles : {n} questions chronométrées ({m} min), score par domaine, seuil de réussite comme à l'ANFR.",
      en: "Real conditions: {n} timed questions ({m} min), per-domain score, pass mark like the real ANFR exam.",
    },
    back: { fr: "← examen", en: "← exam" },
    nextQ: { fr: "Question suivante →", en: "Next question →" },
    abandon: { fr: "← abandonner", en: "← abandon" },
    finish: { fr: "Terminer", en: "Finish" },
    finishExam: { fr: "Terminer l'examen", en: "Finish the exam" },
    passed: { fr: "Examen blanc réussi !", en: "Mock exam passed!" },
    failed: { fr: "Pas encore…", en: "Not yet…" },
    threshold: {
      fr: "Seuil : la moitié des points dans chaque domaine.",
      en: "Pass mark: half the points in each domain.",
    },
    backBtn: { fr: "Retour", en: "Back" },
    review: { fr: "À revoir", en: "To review" },
    revise: { fr: "→ réviser cette notion", en: "→ revisit this notion" },
    frNote: {
      fr: "Basé sur le programme français (ANFR) — harmonisé HAREC.",
      en: "Based on the French (ANFR) syllabus — HAREC-harmonised.",
    },
  },

  pro: {
    badge: { fr: "PRO", en: "PRO" },
    upgrade: { fr: "passer Pro", en: "go Pro" },
    title2: { fr: "Pro", en: "Pro" },
    f1: {
      fr: "Radar ADS-B — décode les avions en vrai (indicatif, altitude, position)",
      en: "ADS-B radar — decode real aircraft (callsign, altitude, position)",
    },
    f2: {
      fr: "Capstone drone — la détection de lien vidéo large bande",
      en: "Drone capstone — wideband video-link detection",
    },
    f3: {
      fr: "Examens blancs chronométrés, notés par domaine comme à l'ANFR",
      en: "Timed mock exams, scored per domain like the real thing",
    },
    f4: {
      fr: "et tu finances un outil indépendant, open-source et 100 % hors-ligne",
      en: "and you fund an independent, open-source, fully offline tool",
    },
    getKey: {
      fr: "☕ Soutenir le projet & recevoir ma clé",
      en: "☕ Support the project & get my key",
    },
    getKeyHint: {
      fr: "Fais un don du montant de ton choix sur Buy Me a Coffee en laissant ton email — ta clé Supporter arrive en retour.",
      en: "Donate any amount on Buy Me a Coffee and leave your email — your Supporter key comes right back.",
    },
    haveKey: { fr: "Déjà une clé ?", en: "Already have a key?" },
    placeholder: { fr: "RFA-XXXXXX-XXXX", en: "RFA-XXXXXX-XXXX" },
    invalid: {
      fr: "Clé invalide — vérifie le format RFA-XXXXXX-XXXX.",
      en: "Invalid key — check the RFA-XXXXXX-XXXX format.",
    },
    later: { fr: "plus tard", en: "later" },
    activate: { fr: "Activer ma clé", en: "Activate my key" },
    activated: { fr: "Licence Pro activée — bienvenue à bord ✓", en: "Pro licence activated — welcome aboard ✓" },
  },

  aircraft: {
    empty: {
      fr: "Aucun avion décodé pour l'instant — les trames Mode S arrivent par rafales, laisse tourner quelques secondes (une antenne dégagée vers le ciel aide beaucoup).",
      en: "No aircraft decoded yet — Mode S frames come in bursts, give it a few seconds (a clear view of the sky helps a lot).",
    },
    flight: { fr: "Vol", en: "Flight" },
    alt: { fr: "Altitude", en: "Altitude" },
    speed: { fr: "Vitesse", en: "Speed" },
    track: { fr: "Cap", en: "Track" },
    pos: { fr: "Position", en: "Position" },
    msgs: { fr: "Msgs", en: "Msgs" },
    seen: { fr: "Vu il y a", en: "Seen" },
    now: { fr: "à l'instant", en: "just now" },
  },

  footer: {
    line: {
      fr: "RF Academy · HackRF / RTL-SDR · réception seule",
      en: "RF Academy · HackRF / RTL-SDR · receive-only",
    },
  },

  donate: {
    support: { fr: "Soutenir", en: "Support" },
    modalHint: {
      fr: "Pas de clé ? Le projet vit aussi de vos dons :",
      en: "No key? The project also lives on donations:",
    },
    coffee: { fr: "☕ Offrir un café", en: "☕ Buy me a coffee" },
  },

  toast: {
    xp: { fr: "XP", en: "XP" },
  },

  level: {
    word: { fr: "Niveau", en: "Level" },
    titles: [
      { fr: "Oreille neuve", en: "Fresh ears" },
      { fr: "Chasseur·se de porteuses", en: "Carrier hunter" },
      { fr: "Lecteur·rice de spectre", en: "Spectrum reader" },
      { fr: "Opérateur·rice de nuit", en: "Night operator" },
      { fr: "Maître des bandes", en: "Master of bands" },
    ] as LStr[],
  },
} as const;

/** Fill {placeholders} in a localized string. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
