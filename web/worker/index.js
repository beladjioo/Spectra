// OpenHertz edge Worker: serves the pre-rendered static site (via the ASSETS
// binding) and collects privacy-first product events at POST /e, writing them
// to a Workers Analytics Engine dataset. No cookies, no PII, no fingerprinting
// — just an event name, a couple of low-cardinality dimensions, and the coarse
// country Cloudflare already knows. Static assets are served directly without
// invoking this Worker; only /e and SPA-fallback paths reach here.

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
]);

const clean = (s, max = 48) => (typeof s === "string" ? s.slice(0, max).replace(/[^\w.:-]/g, "") : "");

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/e") {
      if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
      ctx.waitUntil(record(request, env));
      // 204, no body — the page never waits on this (sendBeacon is fire-and-forget)
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
    }

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
