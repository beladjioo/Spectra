// The learning journey: five stages from "what is a dB?" to the licence.
// Each stage mixes reading (library notes), doing (missions) and a checkpoint.
// Stages are addressed by a frequency — the journey climbs the spectrum.

import type { LStr } from "./lib/i18n";
import type { IconName } from "./components/Icon";
import { MISSIONS } from "./missions";

export type Step = { kind: "note"; slug: string } | { kind: "mission"; id: string } | { kind: "exam" };

export type Stage = {
  id: string;
  icon: IconName;
  /** The stage's "address" on the dial — the journey climbs the spectrum. */
  dial: string;
  title: LStr;
  hook: LStr;
  steps: Step[];
};

export const STAGES: Stage[] = [
  {
    id: "discover",
    icon: "sprout",
    dial: "98 MHz",
    title: { fr: "Découvrir", en: "Discover" },
    hook: {
      fr: "C'est quoi une onde ? Pourquoi des dB ? Ta toute première écoute, sans rien casser.",
      en: "What's a wave? Why dB? Your very first listen, with nothing to break.",
    },
    steps: [
      { kind: "note", slug: "ondes-radio" },
      { kind: "note", slug: "decibels" },
      { kind: "note", slug: "bruit-et-snr" },
      { kind: "mission", id: "first-contact" },
    ],
  },
  {
    id: "hands-on",
    icon: "flask",
    dial: "100.2 MHz",
    title: { fr: "Premières manips", en: "First experiments" },
    hook: {
      fr: "Lis un spectre comme une carte, apprends le waterfall, et capte ta première station.",
      en: "Read a spectrum like a map, learn the waterfall, and catch your first station.",
    },
    steps: [
      { kind: "note", slug: "fft-spectre" },
      { kind: "note", slug: "waterfall" },
      { kind: "note", slug: "materiel-debuter" },
      { kind: "note", slug: "hackrf" },
      { kind: "mission", id: "fm" },
    ],
  },
  {
    id: "intermediate",
    icon: "burst",
    dial: "868 MHz",
    title: { fr: "Monter en fréquence", en: "Climbing the spectrum" },
    hook: {
      fr: "I/Q, modulations, antennes — puis chasse les objets connectés et le chaos du WiFi.",
      en: "I/Q, modulation, antennas — then hunt IoT devices and the WiFi chaos.",
    },
    steps: [
      { kind: "note", slug: "echantillonnage" },
      { kind: "note", slug: "iq" },
      { kind: "note", slug: "modulations" },
      { kind: "note", slug: "antennes" },
      { kind: "note", slug: "reglage-antenne" },
      { kind: "mission", id: "ism868" },
      { kind: "mission", id: "wifi24" },
    ],
  },
  {
    id: "advanced",
    icon: "plane",
    dial: "1090 MHz",
    title: { fr: "Décoder le réel", en: "Decoding the real world" },
    hook: {
      fr: "Ne plus seulement voir les signaux : les comprendre. Avions en direct, signature d'un drone.",
      en: "Stop just seeing signals: understand them. Live aircraft, a drone's signature.",
    },
    steps: [
      { kind: "note", slug: "decoder-vs-detecter" },
      { kind: "note", slug: "bandes-a-explorer" },
      { kind: "note", slug: "workflow-live" },
      { kind: "note", slug: "legal-securite" },
      { kind: "mission", id: "adsb" },
      { kind: "note", slug: "guerre-electronique" },
      { kind: "note", slug: "drones-champ-bataille" },
      { kind: "mission", id: "drone" },
    ],
  },
  {
    id: "licence",
    icon: "cap",
    dial: "144 MHz",
    title: { fr: "Vers la licence", en: "Toward the licence" },
    hook: {
      fr: "Réglementation, code Q, électricité : tout pour passer l'examen et émettre un jour à ton tour.",
      en: "Regulations, Q-codes, electricity: everything to pass the exam and one day transmit yourself.",
    },
    steps: [
      { kind: "note", slug: "examen-radioamateur" },
      { kind: "note", slug: "reglementation" },
      { kind: "note", slug: "bandes-radioamateur" },
      { kind: "note", slug: "code-q-phonetique-rst" },
      { kind: "exam" },
    ],
  },
];

// ── progress ────────────────────────────────────────────────────────────────

const READ_KEY = "rfa-read";
export const EXAM_DONE_KEY = "rfa-exam-passed";

export function readSlugs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function markRead(slug: string) {
  try {
    const s = readSlugs();
    if (s.has(slug)) return;
    s.add(slug);
    localStorage.setItem(READ_KEY, JSON.stringify([...s]));
  } catch {
    /* storage blocked (private mode) — reading must still work */
  }
}

export function stepDone(step: Step, read: Set<string>, completed: string[]): boolean {
  switch (step.kind) {
    case "note":
      return read.has(step.slug);
    case "mission":
      return completed.includes(step.id);
    case "exam":
      return localStorage.getItem(EXAM_DONE_KEY) === "1";
  }
}

export function stageProgress(stage: Stage, read: Set<string>, completed: string[]): number {
  const done = stage.steps.filter((s) => stepDone(s, read, completed)).length;
  return done / stage.steps.length;
}

/** A stage opens once the previous one is at least half done. */
export function stageUnlocked(i: number, read: Set<string>, completed: string[]): boolean {
  if (i === 0) return true;
  return stageProgress(STAGES[i - 1], read, completed) >= 0.5;
}

export function missionById(id: string) {
  return MISSIONS.find((m) => m.id === id);
}
