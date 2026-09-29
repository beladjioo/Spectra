// OpenHertz edge Worker: serves the pre-rendered static site (via the ASSETS
// binding), exposes the visitor's coarse country at GET /geo (so the app can
// default France to French while English stays the base everywhere else), and
// collects privacy-first product events at POST /e, writing them to a Workers
// Analytics Engine dataset. No cookies, no PII, no fingerprinting — just an
// event name, a couple of low-cardinality dimensions, and the coarse country
// Cloudflare already knows. Static assets are served directly without invoking
// this Worker; only /geo, /e, /api/prep/* and SPA-fallback paths reach here.
//
// Paid exam prep (/api/prep/*): the repo is public, so the paid question bank
// never lives in it — it sits in the PREP KV namespace (key "bank:v1"). A buyer
// pastes the Polar license key they received; the Worker checks it against
// Polar's public validate endpoint and hands back a short-lived HMAC token that
// unlocks GET /api/prep/bank. Nothing is stored about the buyer. Until PREP,
// PREP_SIGNING_KEY and POLAR_ORG_ID are all configured, the feature reports
// itself disabled and the app hides it.

// Events we accept (anything else is dropped — no open firehose).
const EVENTS = new Set([
  "mission_started",
  "mission_completed",
  "sdr_connected",
  "sim_session",
  "live_session",
  "note_read",
  "exam_started",
  "exam_passed",
  "donate_click",
  "page_view",
  "prep_checkout_click",
  "prep_unlocked",
]);

const clean = (s, max = 48) => (typeof s === "string" ? s.slice(0, max).replace(/[^\w.:-]/g, "") : "");

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Coarse geolocation for first-visit language defaulting. No storage, no
    // logging — the app reads only { country } and forgets it.
    if (url.pathname === "/geo") {
      const country = (request.cf && request.cf.country) || "XX";
      return new Response(JSON.stringify({ country }), {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      });
    }

    if (url.pathname === "/e") {
      if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
      ctx.waitUntil(record(request, env));
      // 204, no body — the page never waits on this (sendBeacon is fire-and-forget)
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
    }

    if (url.pathname.startsWith("/api/prep/")) return prep(request, env, url);

    // everything else is the pre-rendered static site (SPA fallback included)
    return env.ASSETS.fetch(request);
  },
};

async function record(request, env) {
  if (!env.EVENTS) return; // binding missing (e.g. local dev) — no-op
  let body = {};
  try {
    body = await request.json();
  } catch {
    return;
  }
  const event = clean(body.e);
  if (!EVENTS.has(event)) return;

  const detail = clean(body.m); // mission id / note slug / driver, per event
  const locale = body.l === "en" ? "en" : "fr";
  const country = (request.cf && request.cf.country) || "XX";
  const source = clean(body.s); // "sim" | "live" | "usb" | ...

  try {
    env.EVENTS.writeDataPoint({
      // blobs are the queryable dimensions; index drives sampling/grouping
      blobs: [event, detail, locale, country, source],
      doubles: [1],
      indexes: [event],
    });
  } catch {
    /* never let analytics break a request */
  }
}

// ── Paid exam prep ───────────────────────────────────────────────────────────

const TOKEN_DAYS = 30; // then the app re-validates the key (refunds/revocations)
const POLAR_VALIDATE = "https://api.polar.sh/v1/customer-portal/license-keys/validate";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const prepEnabled = (env) => Boolean(env.PREP && env.PREP_SIGNING_KEY && env.POLAR_ORG_ID);

async function prep(request, env, url) {
  if (url.pathname === "/api/prep/config") {
    const on = prepEnabled(env) && Boolean(env.PREP_CHECKOUT_URL);
    return json({
      enabled: on,
      checkoutUrl: on ? env.PREP_CHECKOUT_URL : null,
      price: on ? env.PREP_PRICE || null : null,
    });
  }
  if (!prepEnabled(env)) return json({ error: "not-configured" }, 503);

  if (url.pathname === "/api/prep/unlock") {
    if (request.method !== "POST") return json({ error: "method" }, 405);
    let key = "";
    try {
      key = String((await request.json()).key || "").trim();
    } catch {
      /* fallthrough */
    }
    if (!key || key.length > 128) return json({ error: "invalid-key" }, 400);
    const lic = await validateLicense(key, env);
    if (!lic) return json({ error: "invalid-key" }, 403);
    const exp = Date.now() + TOKEN_DAYS * 86_400_000;
    return json({ token: await sign({ sub: lic.id, exp }, env.PREP_SIGNING_KEY), exp });
  }

  if (url.pathname === "/api/prep/bank") {
    const auth = request.headers.get("authorization") || "";
    const claims = await verify(auth.replace(/^Bearer\s+/i, ""), env.PREP_SIGNING_KEY);
    if (!claims || claims.exp < Date.now()) return json({ error: "unauthorized" }, 401);
    const bank = await env.PREP.get("bank:v1");
    if (!bank) return json({ error: "empty" }, 503);
    return new Response(bank, {
      headers: { "content-type": "application/json", "cache-control": "private, no-store" },
    });
  }

  return json({ error: "not-found" }, 404);
}

/** Polar license check. Returns { id } when granted (and, if configured, for our benefit). */
async function validateLicense(key, env) {
  const body = { key, organization_id: env.POLAR_ORG_ID };
  if (env.POLAR_BENEFIT_ID) body.benefit_id = env.POLAR_BENEFIT_ID;
  try {
    const r = await fetch(POLAR_VALIDATE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    const lic = await r.json();
    if (lic.status !== "granted") return null;
    if (lic.expires_at && Date.parse(lic.expires_at) < Date.now()) return null;
    return { id: String(lic.id) };
  } catch {
    return null;
  }
}

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function sign(claims, secret) {
  const payload = b64u(new TextEncoder().encode(JSON.stringify(claims)));
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${b64u(mac)}`;
}

export async function verify(token, secret) {
  const [payload, mac] = String(token).split(".");
  if (!payload || !mac) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), unb64u(mac), new TextEncoder().encode(payload));
    return ok ? JSON.parse(new TextDecoder().decode(unb64u(payload))) : null;
  } catch {
    return null;
  }
}
