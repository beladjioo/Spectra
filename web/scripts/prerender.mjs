#!/usr/bin/env node
// Build-time prerender: turn the SPA into crawlable static HTML. For every
// route × locale we emit a real <head> (title, description, canonical,
// hreflang, OpenGraph/Twitter, JSON-LD) and the note/mission text in the body,
// so Google and social cards see content instead of an empty <div id=root>.
// React still mounts on top at runtime. No browser needed — content is
// markdown, rendered with micromark (the same engine react-markdown uses).
// Run from web/ (after `vite build`): node scripts/prerender.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";

const SITE = "https://openhertz.org";
const DIST = "dist";
const OG = `${SITE}/og.png`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── built asset tags (hashed) — reused verbatim on every page ────────────── */
const builtIndex = readFileSync(`${DIST}/index.html`, "utf8");
const headTags = [...builtIndex.matchAll(/<(script|link)\b[^>]*?>(?:<\/script>)?/g)]
  .map((m) => m[0])
  .filter((t) => /\/assets\/|\/fonts\/|favicon|apple-touch|theme-color/.test(t))
  .join("\n    ");

/* ── content ──────────────────────────────────────────────────────────────── */
// English is the base locale (served at the root); French lives under /fr.
const LOCALES = ["en", "fr"];
const slugs = readdirSync("content/fr").map((f) => f.replace(/\.md$/, ""));
const note = (slug, loc) => {
  try {
    return readFileSync(`content/${loc}/${slug}.md`, "utf8");
  } catch {
    return readFileSync(`content/fr/${slug}.md`, "utf8");
  }
};
const titleOf = (md) => (md.match(/^#\s+(.+)$/m)?.[1] || "").trim();
const firstPara = (md) =>
  (md
    .replace(/^#.*$/gm, "")
    .split("\n\n")
    .map((s) => s.trim())
    .find((s) => s && !s.startsWith(">") && !s.startsWith("|") && !s.startsWith("```")) || "")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, s, l) => l || s)
    .replace(/[*`_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const clip = (s, n = 155) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** Resolve [[wikilinks]] and (#note:/#mission:) into real hrefs for crawlers. */
function preprocess(md, base) {
  return md
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, slug, label) => {
      const s = slug.trim();
      return `[${label || titleOf(note(s, "en"))}](${base}/library/${s})`;
    })
    .replace(/\(#note:([a-z0-9-]+)\)/g, (_, s) => `(${base}/library/${s})`)
    .replace(/\(#mission:([a-z0-9-]+)\)/g, (_, id) => `(${base}/mission/${id})`);
}
const render = (md, base) =>
  micromark(preprocess(md, base), { extensions: [gfm()], htmlExtensions: [gfmHtml()] });

/* ── missions (parsed from the source of truth) ───────────────────────────── */
const missionsSrc = readFileSync("src/missions.ts", "utf8");
const MISSIONS = [...missionsSrc.matchAll(
  /id: "([a-z0-9-]+)",[\s\S]*?title: \{ fr: "([^"]+)", en: "([^"]+)" \},[\s\S]*?tagline: \{\s*fr: "([^"]+)",\s*en: "([^"]+)"/g,
)].map((m) => ({ id: m[1], title: { fr: m[2], en: m[3] }, tagline: { fr: m[4], en: m[5] } }));

/* ── per-locale copy for the static views ─────────────────────────────────── */
const STR = {
  tagline: { fr: "écoute le monde invisible", en: "listen to the invisible world" },
  heroH1: {
    fr: "L'air est plein de signaux. Apprends à les entendre.",
    en: "The air is full of signals. Learn to hear them.",
  },
  heroP: {
    fr: "OpenHertz t'apprend la radio et le SDR en la pratiquant, mission par mission — gratuit, open source, et 100 % en réception seule. Branche un RTL-SDR ou un HackRF, ou utilise le simulateur intégré.",
    en: "OpenHertz teaches you radio and SDR by doing it, mission by mission — free, open source, and 100% receive-only. Plug in an RTL-SDR or a HackRF, or use the built-in simulator.",
  },
  missionsH: { fr: "Les missions", en: "The missions" },
  libraryH: { fr: "La bibliothèque", en: "The library" },
  views: {
    console: {
      fr: ["Console SDR", "Pilote une radio logicielle en direct : accord, bande passante, gain, écoute FM/AM démodulée dans le navigateur."],
      en: ["SDR console", "Drive a software-defined radio live: tuning, bandwidth, gain, FM/AM audio demodulated in the browser."],
    },
    map: {
      fr: ["Carte de couverture", "Visualise ta réception : avions ADS-B en direct et portée typique par bande, centrée sur ta position."],
      en: ["Coverage map", "See your reception: live ADS-B aircraft and typical reach per band, centred on your location."],
    },
    exam: {
      fr: ["Examen radioamateur", "Prépare l'examen : questions type ANFR en répétition espacée et examen blanc chronométré."],
      en: ["Amateur-radio exam", "Prepare for the exam: ANFR-style questions with spaced repetition and a timed mock exam."],
    },
  },
};

/* ── HTML assembly ────────────────────────────────────────────────────────── */
function buildPage({ loc, path, title, description, body, jsonld }) {
  const canon = loc === "en" ? `${SITE}${path}` : `${SITE}/fr${path}`;
  const alt = (l) => (l === "en" ? `${SITE}${path}` : `${SITE}/fr${path}`);
  const ogLocale = (l) => (l === "fr" ? "fr_FR" : "en_US");
  const t = `${title} — OpenHertz`;
  return `<!doctype html>
<html lang="${loc}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(t)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${canon}" />
    <link rel="alternate" hreflang="en" href="${alt("en")}" />
    <link rel="alternate" hreflang="fr" href="${alt("fr")}" />
    <link rel="alternate" hreflang="x-default" href="${alt("en")}" />
    <meta property="og:site_name" content="OpenHertz" />
    <meta property="og:locale" content="${ogLocale(loc)}" />
    <meta property="og:locale:alternate" content="${ogLocale(loc === "fr" ? "en" : "fr")}" />
    <meta property="og:title" content="${esc(t)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canon}" />
    <meta property="og:image" content="${OG}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(t)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${OG}" />
    <script type="application/ld+json">${JSON.stringify(jsonld)}</script>
    ${headTags}
  </head>
  <body>
    <div id="root"><main class="prerender" hidden>${body}</main></div>
  </body>
</html>
`;
}

function write(routePath, html) {
  const dir = `${DIST}${routePath === "/" ? "" : routePath}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, html);
}

/* ── emit every route × locale ────────────────────────────────────────────── */
const urls = new Set();
for (const loc of LOCALES) {
  const base = loc === "en" ? "" : "/fr";
  const out = (p, html) => {
    const rp = loc === "en" ? p : `/fr${p === "/" ? "" : p}`;
    write(rp, html);
    urls.add(rp === "" ? "/" : rp);
  };

  const missionLinks = MISSIONS.map(
    (m) => `<li><a href="${base}/mission/${m.id}">${esc(m.title[loc])}</a> — ${esc(m.tagline[loc])}</li>`,
  ).join("\n");
  const noteLinks = slugs
    .map((s) => `<li><a href="${base}/library/${s}">${esc(titleOf(note(s, loc)))}</a></li>`)
    .join("\n");
  out(
    "/",
    buildPage({
      loc,
      path: "/",
      title: STR.tagline[loc].charAt(0).toUpperCase() + STR.tagline[loc].slice(1),
      description: clip(STR.heroP[loc]),
      body: `<h1>${esc(STR.heroH1[loc])}</h1>\n<p>${esc(STR.heroP[loc])}</p>\n<h2>${esc(STR.missionsH[loc])}</h2>\n<ul>${missionLinks}</ul>\n<h2>${esc(STR.libraryH[loc])}</h2>\n<ul>${noteLinks}</ul>`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "OpenHertz",
        url: SITE,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        inLanguage: loc,
        description: STR.heroP[loc],
      },
    }),
  );

  for (const [view, copy] of Object.entries(STR.views)) {
    out(
      `/${view}`,
      buildPage({
        loc,
        path: `/${view}`,
        title: copy[loc][0],
        description: clip(copy[loc][1]),
        body: `<h1>${esc(copy[loc][0])}</h1><p>${esc(copy[loc][1])}</p>`,
        jsonld: { "@context": "https://schema.org", "@type": "WebPage", name: copy[loc][0], inLanguage: loc },
      }),
    );
  }

  for (const slug of slugs) {
    const md = note(slug, loc);
    out(
      `/library/${slug}`,
      buildPage({
        loc,
        path: `/library/${slug}`,
        title: titleOf(md),
        description: clip(firstPara(md)),
        body: render(md, base),
        jsonld: {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: titleOf(md),
          inLanguage: loc,
          isPartOf: { "@type": "Course", name: "OpenHertz", provider: { "@type": "Organization", name: "OpenHertz" } },
          description: clip(firstPara(md)),
        },
      }),
    );
  }

  for (const m of MISSIONS) {
    out(
      `/mission/${m.id}`,
      buildPage({
        loc,
        path: `/mission/${m.id}`,
        title: m.title[loc],
        description: clip(m.tagline[loc]),
        body: `<h1>${esc(m.title[loc])}</h1><p>${esc(m.tagline[loc])}</p>`,
        jsonld: {
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: m.title[loc],
          learningResourceType: "Interactive mission",
          inLanguage: loc,
          isPartOf: { "@type": "Course", name: "OpenHertz" },
        },
      }),
    );
  }
}

/* ── sitemap + robots ─────────────────────────────────────────────────────── */
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map((u) => `  <url><loc>${SITE}${u === "/" ? "/" : u}</loc></url>`)
  .join("\n")}
</urlset>
`;
writeFileSync(`${DIST}/sitemap.xml`, sitemap);
writeFileSync(`${DIST}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Prerendered ${urls.size} pages (${slugs.length} notes + ${MISSIONS.length} missions × ${LOCALES.length} locales) + sitemap.`);
