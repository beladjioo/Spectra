// Privacy-first product analytics. Fires named events to the edge Worker's
// POST /e via navigator.sendBeacon (fire-and-forget, never blocks the UI, sent
// even as the page unloads). No cookies, no identifiers, no PII — just an event
// name plus a couple of low-cardinality dimensions. The Worker adds the coarse
// country Cloudflare already knows and writes to Analytics Engine.

export type EventName =
  | "mission_started"
  | "mission_completed"
  | "sdr_connected"
  | "sim_session"
  | "live_session"
  | "note_read"
  | "exam_started"
  | "exam_passed"
  | "donate_click"
  | "page_view";

type Detail = { m?: string; s?: string };

function locale(): "fr" | "en" {
  try {
    return localStorage.getItem("rfa-locale") === "en" ? "en" : "fr";
  } catch {
    return document.documentElement.lang === "en" ? "en" : "fr";
  }
}

// de-dupe noisy repeats within a session (e.g. a note re-rendering)
const sent = new Set<string>();

export function track(e: EventName, detail: Detail = {}) {
  try {
    const key = `${e}:${detail.m ?? ""}`;
    if ((e === "note_read" || e === "mission_started" || e === "page_view") && sent.has(key)) return;
    sent.add(key);
    const body = JSON.stringify({ e, m: detail.m, s: detail.s, l: locale() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/e", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/e", { method: "POST", body, keepalive: true });
    }
  } catch {
    /* analytics must never throw into the app */
  }
}
