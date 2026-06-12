# Domain & branding — OpenHertz

The project was renamed from **RF Academy** to **OpenHertz** on 2026-06-12.

## Why rename

- "RF Academy" is already used by the French national education portal
  (éduscol: *RF Academy — introduction à la modulation de fréquence*), and the
  obvious domains (`rfacademy.com`, `rf-academy.com`) are taken. Keeping the name
  risked lasting confusion.
- **OpenHertz** evokes both *open source* and *Hertz* (the unit of frequency),
  is pronounceable in French and English, reads as serious and timeless, and the
  domains were available when chosen.

## Domain

**`openhertz.org`** — registered via **Cloudflare Registrar** on 2026-06-12, so
the zone is already active in the account and DNS/SSL/cache are native.
`openhertz.com` was taken; `.org` fits an open, educational project best.

## Wiring (done)

The Worker (`web/wrangler.jsonc`) carries two `custom_domain` routes —
`openhertz.org` and `www.openhertz.org` — both pointing at the single
`rf-academy` Worker. On `npx wrangler deploy`, Cloudflare provisions the TLS
certificate and the DNS records automatically. The workers.dev URL
(`rf-academy.spectra-rf.workers.dev`) keeps serving the same deployment.

Recommended dashboard hardening (one-time, optional):
- **SSL/TLS** mode → *Full (strict)*, and *Always Use HTTPS* on.
- **Speed** → Brotli, HTTP/3, Early Hints on.
- **Security** → enable the WAF managed ruleset.

## What changed in the code for the rename

- App wordmark, page `<title>`, meta/OpenGraph tags, and favicon (`web/public/favicon.svg`).
- UI copy and footer (`web/src/lib/i18n.tsx`).
- README and this doc.

The internal Worker name and the `rf-academy-progress` localStorage key were
deliberately left unchanged to avoid breaking the live deployment and existing
visitors' saved progress.
