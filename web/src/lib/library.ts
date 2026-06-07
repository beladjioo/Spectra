// Loads the original SDR knowledge base (web/content/*.md) and provides the
// Obsidian-style plumbing: titles, sections, wikilinks, backlinks, search.

const raw = import.meta.glob("../../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const slugFromPath = (p: string) => p.split("/").pop()!.replace(/\.md$/, "");

/** slug -> raw markdown body */
export const NOTES: Record<string, string> = {};
for (const p in raw) NOTES[slugFromPath(p)] = raw[p];

/** First "# Heading" of a note, used as its title. */
export function titleOf(slug: string): string {
  const m = (NOTES[slug] || "").match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : slug;
}

export type Section = { title: string; notes: string[] };

/** Sidebar order. Anything not listed is appended under "Divers". */
export const SECTIONS: Section[] = [
  { title: "Pour commencer", notes: ["bienvenue"] },
  { title: "Fondamentaux RF", notes: ["ondes-radio", "decibels", "bruit-et-snr"] },
  { title: "Le signal numérique", notes: ["echantillonnage", "iq"] },
  { title: "Spectre & DSP", notes: ["fft-spectre", "waterfall"] },
  { title: "Le matériel", notes: ["sdr-architecture", "hackrf", "antennes"] },
  { title: "Modulations", notes: ["modulations"] },
  {
    title: "En pratique",
    notes: ["workflow-live", "bandes-a-explorer", "decoder-vs-detecter", "legal-securite"],
  },
  {
    title: "Radioamateur — réglementation & trafic",
    notes: [
      "examen-radioamateur",
      "reglementation",
      "bandes-radioamateur",
      "indicatifs-trafic-journal",
      "code-q-phonetique-rst",
    ],
  },
  {
    title: "Radioamateur — technique",
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
export function preprocess(md: string): string {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, slug, label) => {
    const s = String(slug).trim();
    return `[${label || titleOf(s)}](#note:${s})`;
  });
}

/** Notes that link to `slug` (via [[slug]] or [[slug|...]]). */
export function backlinks(slug: string): string[] {
  const re = new RegExp(`\\[\\[${slug}(\\||\\])`);
  return Object.keys(NOTES).filter((s) => s !== slug && re.test(NOTES[s]));
}

/** Simple title+body substring search. */
export function search(q: string): string[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return Object.keys(NOTES)
    .filter((s) => titleOf(s).toLowerCase().includes(t) || NOTES[s].toLowerCase().includes(t))
    .sort((a, b) => titleOf(a).localeCompare(titleOf(b)))
    .slice(0, 25);
}
