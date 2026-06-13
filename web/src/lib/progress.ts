// Local-first progress backup. Everything the learner earns lives in
// localStorage; one browser cleanup would wipe it. These helpers export it all
// to a small JSON file (or copyable string) and import it back. No accounts,
// no server.

// Every key OpenHertz writes to localStorage that represents *progress*.
const KEYS = [
  "rf-academy-progress", // xp + completed missions
  "rfa-read", // read library notes
  "rfa-quiz-v1", // spaced-repetition state
  "rfa-exam-passed", // journey checkpoint
  "rfa-locale", // preferred language
];

const MAGIC = "openhertz-progress";

export type Backup = { app: typeof MAGIC; v: 1; saved: string; data: Record<string, string> };

export function exportProgress(): Backup {
  const data: Record<string, string> = {};
  for (const k of KEYS) {
    try {
      const v = localStorage.getItem(k);
      if (v != null) data[k] = v;
    } catch {
      /* ignore */
    }
  }
  return { app: MAGIC, v: 1, saved: new Date().toISOString(), data };
}

export function exportFilename(): string {
  return `openhertz-progress-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Trigger a download of the backup JSON. */
export function downloadProgress() {
  const blob = new Blob([JSON.stringify(exportProgress(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = exportFilename();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Restore from a backup object or raw JSON string. Returns how many keys were
 *  applied, or throws on an unrecognised file. */
export function importProgress(input: string | Backup): number {
  const obj: Backup = typeof input === "string" ? JSON.parse(input) : input;
  if (!obj || obj.app !== MAGIC || !obj.data) {
    throw new Error("not an OpenHertz progress file");
  }
  let n = 0;
  for (const [k, v] of Object.entries(obj.data)) {
    if (!KEYS.includes(k) || typeof v !== "string") continue;
    try {
      localStorage.setItem(k, v);
      n++;
    } catch {
      /* storage blocked */
    }
  }
  return n;
}
