// Bilingual knowledge base (web/content/{fr,en}/*.md) with Obsidian-style
// plumbing: titles, sections, wikilinks, backlinks, search. Slugs are shared
// across locales; English falls back to French if a translation is missing.

import type { Locale, LStr } from "./i18n";

const rawFr = import.meta.glob("../../content/fr/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const rawEn = import.meta.glob("../../content/en/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const slugFromPath = (p: string) => p.split("/").pop()!.replace(/\.md$/, "");

const byLocale: Record<Locale, Record<string, string>> = { fr: {}, en: {} };
for (const p in rawFr) byLocale.fr[slugFromPath(p)] = rawFr[p];
for (const p in rawEn) byLocale.en[slugFromPath(p)] = rawEn[p];

export const SLUGS = Object.keys(byLocale.fr);

/** Raw markdown of a note in the given locale (FR fallback). */
export function note(slug: string, locale: Locale): string | undefined {
  return byLocale[locale][slug] ?? byLocale.fr[slug];
}

/** First "# Heading" of a note, used as its title. */
export function titleOf(slug: string, locale: Locale): string {
  const m = (note(slug, locale) || "").match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : slug;
}

export type Section = { title: LStr; notes: string[] };

/** Sidebar order. */
export const SECTIONS: Section[] = [
  { title: { fr: "Pour commencer", en: "Start here" }, notes: ["bienvenue"] },
  {
    title: { fr: "Fondamentaux RF", en: "RF fundamentals" },
    notes: ["ondes-radio", "decibels", "bruit-et-snr"],
  },
  {
    title: { fr: "Le signal numérique", en: "The digital signal" },
    notes: ["echantillonnage", "iq"],
  },
  { title: { fr: "Spectre & DSP", en: "Spectrum & DSP" }, notes: ["fft-spectre", "waterfall"] },
  {
    title: { fr: "Le matériel", en: "The hardware" },
    notes: ["materiel-debuter", "sdr-architecture", "hackrf", "antennes", "reglage-antenne"],
  },
  { title: { fr: "Modulations", en: "Modulation" }, notes: ["modulations"] },
  {
    title: { fr: "En pratique", en: "In practice" },
    notes: ["workflow-live", "bandes-a-explorer", "decoder-vs-detecter", "legal-securite"],
  },
  {
    title: { fr: "Missions guidées", en: "Guided missions" },
    notes: ["airband", "pocsag", "satellites-meteo"],
  },
  {
    title: { fr: "Guerre électronique & drones", en: "Electronic warfare & drones" },
    notes: ["guerre-electronique", "drones-champ-bataille"],
  },
  {
    title: { fr: "Radioamateur — réglementation & trafic", en: "Ham radio — regulations & operating" },
    notes: [
      "examen-radioamateur",
      "reglementation",
      "bandes-radioamateur",
      "indicatifs-trafic-journal",
      "code-q-phonetique-rst",
    ],
  },
  {
    title: { fr: "Radioamateur — technique", en: "Ham radio — technical" },
    notes: [
      "electricite",
      "composants-electroniques",
      "circuits-resonance-filtres",
      "emetteur-recepteur",
      "propagation",
      "lignes-ros-adaptation",
      "securite-cem",
    ],
  },
];

export const FIRST_NOTE = "bienvenue";

/** Turn [[slug]] / [[slug|label]] into markdown links the renderer understands. */
export function preprocess(md: string, locale: Locale): string {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, slug, label) => {
    const s = String(slug).trim();
    return `[${label || titleOf(s, locale)}](#note:${s})`;
  });
}

/** Notes that link to `slug` (via [[slug]] or [[slug|...]]). */
export function backlinks(slug: string, locale: Locale): string[] {
  const re = new RegExp(`\\[\\[${slug}(\\||\\])`);
  return SLUGS.filter((s) => s !== slug && re.test(note(s, locale) || ""));
}

/** Simple title+body substring search in the active locale. */
export function search(q: string, locale: Locale): string[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return SLUGS.filter((s) => {
    const body = (note(s, locale) || "").toLowerCase();
    return body.includes(t) || titleOf(s, locale).toLowerCase().includes(t);
  }).slice(0, 20);
}
