#!/usr/bin/env node
// Génère des clés de licence RF Academy Pro (format RFA-XXXXXX-CCCC).
// Usage: node tools/genkey.mjs [n]

function checksum(s) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
}

const ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const n = parseInt(process.argv[2] || "1", 10);
for (let i = 0; i < n; i++) {
  let body = "";
  for (let k = 0; k < 6; k++) body += ALPHA[Math.floor(Math.random() * 36)];
  console.log(`RFA-${body}-${checksum(body)}`);
}
