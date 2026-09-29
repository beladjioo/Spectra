// Prépa complète (payante) — la banque de questions supplémentaire.
// Paid exam prep: the extra question bank. It never ships in the bundle (the
// repo is public): the Worker checks the buyer's Polar license key and returns
// a 30-day token that unlocks GET /api/prep/bank. The key, token and bank are
// kept in this browser only, so the pack also works offline once unlocked.

import { useCallback, useEffect, useState } from "react";
import type { Question } from "../quiz";

const KEY = "rfa-prep-key";
const TOKEN = "rfa-prep-token";
const BANK = "rfa-prep-bank";

export type PrepConfig = { enabled: boolean; checkoutUrl: string | null; price: string | null };

const get = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode: the pack still works for this visit */
  }
};

const isLStr = (x: unknown) =>
  !!x && typeof (x as { fr?: unknown }).fr === "string" && typeof (x as { en?: unknown }).en === "string";

/** Keep only well-formed questions — the bank is data from the network. */
export function parseBank(raw: unknown): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (q): q is Question =>
      !!q &&
      typeof q.id === "string" &&
      q.id.startsWith("p-") &&
      (q.cat === "reglementation" || q.cat === "technique") &&
      isLStr(q.q) &&
      Array.isArray(q.choices) &&
      q.choices.length === 4 &&
      q.choices.every(isLStr) &&
      [0, 1, 2, 3].includes(q.answer) &&
      isLStr(q.why),
  );
}

async function fetchToken(key: string): Promise<string> {
  const r = await fetch("/api/prep/unlock", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!r.ok) throw new Error(r.status === 403 || r.status === 400 ? "invalid-key" : "unavailable");
  const { token, exp } = await r.json();
  set(TOKEN, JSON.stringify({ token, exp }));
  return token;
}

async function fetchBank(key: string): Promise<Question[]> {
  let tok: { token: string; exp: number } | null = null;
  try {
    tok = JSON.parse(get(TOKEN) || "null");
  } catch {
    tok = null;
  }
  const token = tok && tok.exp > Date.now() + 60_000 ? tok.token : await fetchToken(key);
  const r = await fetch("/api/prep/bank", { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(r.status === 401 ? "invalid-key" : "unavailable");
  const bank = parseBank(await r.json());
  set(BANK, JSON.stringify(bank));
  return bank;
}

export function usePrep() {
  const [config, setConfig] = useState<PrepConfig | null>(null);
  const [paid, setPaid] = useState<Question[]>(() => {
    try {
      return get(KEY) ? parseBank(JSON.parse(get(BANK) || "[]")) : [];
    } catch {
      return [];
    }
  });
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState<"invalid-key" | "unavailable" | null>(null);

  useEffect(() => {
    fetch("/api/prep/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setConfig(c && c.enabled ? c : { enabled: false, checkoutUrl: null, price: null }))
      .catch(() => setConfig({ enabled: false, checkoutUrl: null, price: null }));
    // refresh a previously unlocked bank quietly (new questions, revoked keys)
    const key = get(KEY);
    if (key)
      fetchBank(key)
        .then(setPaid)
        .catch((e) => {
          if (e.message === "invalid-key") {
            setPaid([]);
            set(BANK, "[]");
          }
        });
  }, []);

  const unlock = useCallback(async (key: string) => {
    setStatus("busy");
    setError(null);
    try {
      set(TOKEN, "");
      const bank = await fetchBank(key.trim());
      set(KEY, key.trim());
      setPaid(bank);
      setStatus("idle");
      return true;
    } catch (e) {
      setError((e as Error).message === "invalid-key" ? "invalid-key" : "unavailable");
      setStatus("error");
      return false;
    }
  }, []);

  return { config, paid, unlocked: paid.length > 0, status, error, unlock };
}
