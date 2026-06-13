/* Bilingual core. Every piece of UI copy lives here as { fr, en }; structured
   content (missions, quiz, journey, notes) carries its own LStr fields and is
   resolved with the same t(). Locale persists and follows the browser on first
   visit. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "fr" | "en";
export type LStr = { fr: string; en: string };

const STORAGE = "rfa-locale";

function initialLocale(): Locale {
  // a shared link carries its language — that beats any local preference
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "fr" || fromUrl === "en") return fromUrl;
  } catch {
    /* ignore */
  }
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
    // keep the URL shareable in the reader's language
    import("./router").then(({ setUrlLang }) => setUrlLang(locale));
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
    map: { fr: "Carte", en: "Map" },
    exam: { fr: "Examen", en: "Exam" },
    library: { fr: "Bibliothèque", en: "Library" },
  },

  map: {
    title: { fr: "Ton ciel radio, vu d'en haut", en: "Your radio sky, from above" },
    sub: {
      fr: "Autorise la géolocalisation : la carte se centre sur toi, affiche les avions décodés en ADS-B autour de toi, et matérialise jusqu'où « porte » ce que tu écoutes.",
      en: "Allow geolocation: the map centres on you, shows the ADS-B aircraft decoded around you, and shows how far what you're listening to can reach.",
    },
    locate: { fr: "Me localiser", en: "Locate me" },
    locating: { fr: "localisation…", en: "locating…" },
    you: { fr: "Toi (récepteur)", en: "You (receiver)" },
    accuracy: { fr: "précision GPS", en: "GPS accuracy" },
    denied: {
      fr: "Géolocalisation refusée — la carte reste en vue monde. Tu peux l'autoriser dans les réglages du site.",
      en: "Geolocation denied — the map stays on the world view. You can allow it in the site settings.",
    },
    aircraft: { fr: "avions décodés (1090 MHz)", en: "decoded aircraft (1090 MHz)" },
    tuneAdsb: {
      fr: "Accorde la radio sur 1090 MHz pour voir les avions →",
      en: "Tune to 1090 MHz to see aircraft →",
    },
    ringHint: {
      fr: "Les anneaux montrent la portée typique des signaux de la bande écoutée — sans antenne directive, on sait « jusqu'où » mais pas « d'où ».",
      en: "The rings show the typical reach of signals in the tuned band — without a directional antenna you know “how far” but not “from where”.",
    },
    rings: {
      fm: { fr: "stations FM · ~70 km", en: "FM stations · ~70 km" },
      air: { fr: "tours de contrôle · ~150 km", en: "control towers · ~150 km" },
      adsb: { fr: "avions en croisière · ~370 km", en: "cruising aircraft · ~370 km" },
      ism: { fr: "capteurs ISM/LoRa · ~2 km", en: "ISM/LoRa sensors · ~2 km" },
      wifi: { fr: "WiFi/Bluetooth · ~100 m", en: "WiFi/Bluetooth · ~100 m" },
      drone: { fr: "liens vidéo drone · ~5 km", en: "drone video links · ~5 km" },
      horizon: { fr: "horizon radio local · ~5 km", en: "local radio horizon · ~5 km" },
    },
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
    none: { fr: "Tu écoutes le simulateur", en: "You're on the simulator" },
    plugIn: {
      fr: "Branche un RTL-SDR (~30 €) ou un HackRF en USB — détection automatique. En attendant, tout fonctionne en simulateur.",
      en: "Plug in an RTL-SDR (~$30) or a HackRF over USB — detected automatically. Meanwhile, everything runs on the simulator.",
    },
    liveBadge: { fr: "EN DIRECT", en: "LIVE" },
    simBadge: { fr: "SIMULATEUR", en: "SIMULATOR" },
  },

  usb: {
    connect: { fr: "Brancher mon SDR (USB)", en: "Plug in my SDR (USB)" },
    disconnect: { fr: "Déconnecter le SDR", en: "Disconnect the SDR" },
    hint: {
      fr: "Spectre synthétique en direct — tout fonctionne. Tu as une clé RTL-SDR (~30 €) ou un HackRF ? Branche-la (Chrome/Edge) : le navigateur la pilote, le traitement reste sur ta machine.",
      en: "Live synthetic spectrum — everything works. Got an RTL-SDR (~$30) or a HackRF? Plug it in (Chrome/Edge): the browser drives it, processing stays on your machine.",
    },
    active: {
      fr: "SDR branché en direct — le spectre que tu vois est réel.",
      en: "SDR live — the spectrum you see is real.",
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
    share: { fr: "Partager ce moment", en: "Share this moment" },
    copied: { fr: "Lien copié — colle-le où tu veux !", en: "Link copied — paste it anywhere!" },
    hwBadge: { fr: "HackRF requis", en: "HackRF required" },
    outOfRange: {
      fr: "Ton {device} plafonne à {max} MHz : cette mission ({band} MHz) tourne en simulateur. Un HackRF (1 MHz–6 GHz) la ferait en vrai.",
      en: "Your {device} tops out at {max} MHz: this mission ({band} MHz) runs in simulator mode. A HackRF (1 MHz–6 GHz) would do it for real.",
    },
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
    stations: { fr: "Signaux captés — clique pour t'accorder", en: "Signals heard — click to tune" },
    noStations: {
      fr: "Aucun signal net pour l'instant. Monte doucement le gain, vérifie que l'antenne est branchée et dégagée, ou change de fréquence.",
      en: "No clear signal yet. Raise the gain gently, check the antenna is connected and in the clear, or try another frequency.",
    },
    tuneTo: { fr: "écouter", en: "listen" },
    qExcellent: { fr: "excellente", en: "excellent" },
    qGood: { fr: "bonne", en: "good" },
    qWeak: { fr: "faible", en: "weak" },
    reception: { fr: "réception", en: "reception" },
    antennaTip: {
      fr: "Une antenne à la bonne longueur change tout :",
      en: "An antenna cut to the right length changes everything:",
    },
    antennaGuide: { fr: "guide de réglage d'antenne", en: "antenna tuning guide" },
    helpSpectrum: { fr: "lire le spectre", en: "reading the spectrum" },
    helpWaterfall: { fr: "le waterfall", en: "the waterfall" },
    helpGain: { fr: "le gain", en: "gain" },
    helpMod: { fr: "les modulations", en: "modulations" },
    helpBands: { fr: "quoi écouter", en: "what to listen to" },
    deemphasis: { fr: "Dé-emphase FM", en: "FM de-emphasis" },
    deemphasisHint: {
      fr: "50 µs : Europe et monde · 75 µs : Amériques, Corée. Mauvais réglage = son trop sourd ou trop sifflant.",
      en: "50 µs: Europe & most of the world · 75 µs: Americas, Korea. Wrong setting = muffled or hissy audio.",
    },
    outOfRangeNote: {
      fr: "Hors de portée de ton {device} (max {max} MHz) — affichage en simulateur.",
      en: "Beyond your {device}'s reach (max {max} MHz) — showing the simulator.",
    },
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

  support: {
    cta: { fr: "Soutenir", en: "Support" },
    title: { fr: "Un outil libre, financé par vous", en: "A free tool, funded by you" },
    body1: {
      fr: "OpenHertz est entièrement gratuit : missions, examen blanc, bibliothèque, pilotage SDR — tout, pour tout le monde, sans compte ni clé.",
      en: "OpenHertz is completely free: missions, mock exam, library, SDR control — everything, for everyone, no account, no key.",
    },
    body2: {
      fr: "Si l'outil t'apprend quelque chose, tu peux financer son développement du prix d'un café. Chaque don paie de nouveaux chapitres, décodeurs et fonctionnalités.",
      en: "If this tool teaches you something, you can fund its development for the price of a coffee. Every donation pays for new chapters, decoders and features.",
    },
    donate: { fr: "Faire un don sur Ko-fi", en: "Donate on Ko-fi" },
    star: { fr: "Étoile sur GitHub", en: "Star on GitHub" },
    free: { fr: "100 % gratuit · open source · réception seule", en: "100% free · open source · receive-only" },
    later: { fr: "plus tard", en: "later" },
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
      fr: "OpenHertz · HackRF / RTL-SDR · réception seule",
      en: "OpenHertz · HackRF / RTL-SDR · receive-only",
    },
  },

  donate: {
    support: { fr: "Soutenir", en: "Support" },
    coffee: { fr: "Offrir un café", en: "Buy me a coffee" },
  },

  backup: {
    link: { fr: "Sauvegarder ma progression", en: "Save my progress" },
    title: { fr: "Sauvegarder & restaurer", en: "Save & restore" },
    intro: {
      fr: "Ta progression (XP, missions, notes lues, révisions) vit dans ce navigateur. Aucun compte : sauvegarde-la dans un fichier pour la garder ou la transférer sur un autre appareil.",
      en: "Your progress (XP, missions, read notes, revision) lives in this browser. No account: save it to a file to keep it or move it to another device.",
    },
    download: { fr: "Télécharger ma sauvegarde", en: "Download my backup" },
    importTitle: { fr: "Restaurer depuis un fichier", en: "Restore from a file" },
    choose: { fr: "Choisir un fichier…", en: "Choose a file…" },
    done: { fr: "Progression restaurée ✓ — {n} éléments.", en: "Progress restored ✓ — {n} items." },
    bad: { fr: "Fichier non reconnu.", en: "Unrecognised file." },
    close: { fr: "Fermer", en: "Close" },
  },

  onboard: {
    title: { fr: "Bienvenue sur OpenHertz", en: "Welcome to OpenHertz" },
    sub: {
      fr: "Apprends la radio en l'écoutant pour de vrai. Comment veux-tu commencer ?",
      en: "Learn radio by actually listening to it. How do you want to start?",
    },
    haveSdr: { fr: "J'ai un RTL-SDR ou un HackRF", en: "I have an RTL-SDR or HackRF" },
    haveSdrSub: {
      fr: "Branche-le dans le navigateur (Chrome/Edge) et pilote-le en direct — tout le traitement reste sur ta machine.",
      en: "Plug it into the browser (Chrome/Edge) and drive it live — all processing stays on your machine.",
    },
    haveNothing: { fr: "Je n'ai pas de matériel", en: "I have no hardware" },
    haveNothingSub: {
      fr: "Aucun souci : tu tournes déjà sur le simulateur. Spectre synthétique en direct, toutes les missions fonctionnent. Branche un vrai SDR quand tu veux.",
      en: "No problem: you're already running on the simulator. Live synthetic spectrum, every mission works. Plug in real hardware anytime.",
    },
    whatIsThis: { fr: "C'est quoi, au juste ?", en: "What is this, exactly?" },
    whatIsThisSub: {
      fr: "Une plateforme libre et gratuite pour apprendre le SDR, mission par mission. Lis l'intro.",
      en: "A free, open platform to learn SDR, mission by mission. Read the intro.",
    },
    startJourney: { fr: "Commencer le voyage", en: "Start the journey" },
    skip: { fr: "passer", en: "skip" },
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
