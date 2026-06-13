#!/usr/bin/env node
// Content link checker, run by CI: validates every [[wikilink]], (#mission:…)
// and (#note:…) target in web/content/{fr,en} against real slugs/mission ids.
// Exits non-zero on any broken target so a bad link can never ship.

import { readdirSync, readFileSync } from "node:fs";

// derive mission ids from the source of truth so this can't drift
const MISSIONS = [...readFileSync("web/src/missions.ts", "utf8").matchAll(/^\s{4}id: "([a-z0-9-]+)",/gm)].map(
  (m) => m[1],
);
const DIRS = ["web/content/fr", "web/content/en"];
const slugs = new Set(readdirSync("web/content/fr").map((f) => f.replace(".md", "")));

let bad = 0;
const report = (file, kind, target) => {
  console.error(`BROKEN ${kind} in ${file} -> ${target}`);
  bad++;
};

for (const dir of DIRS) {
  for (const f of readdirSync(dir)) {
    const body = readFileSync(`${dir}/${f}`, "utf8");
    for (const m of body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)) {
      if (!slugs.has(m[1].trim())) report(`${dir}/${f}`, "wikilink", m[1]);
    }
    for (const m of body.matchAll(/\(#mission:([a-z0-9-]+)\)/g)) {
      if (!MISSIONS.includes(m[1])) report(`${dir}/${f}`, "mission link", m[1]);
    }
    for (const m of body.matchAll(/\(#note:([a-z0-9-]+)\)/g)) {
      if (!slugs.has(m[1])) report(`${dir}/${f}`, "note link", m[1]);
    }
  }
}

// every FR note must have an EN counterpart (FR fallback exists, but we want parity)
const en = new Set(readdirSync("web/content/en"));
for (const f of readdirSync("web/content/fr")) {
  if (!en.has(f)) console.warn(`WARN missing EN translation: ${f}`);
}

if (bad) {
  console.error(`\n${bad} broken link target(s).`);
  process.exit(1);
}
console.log(`All link targets valid across ${DIRS.length} locales (${slugs.size} notes).`);
