import { useEffect, useMemo, useRef, useState } from "react";
import Spectrum from "./components/Spectrum";
import Waterfall from "./components/Waterfall";
import Library from "./components/Library";
import Console from "./components/Console";
import { useRf, tune, type Frame } from "./lib/useRf";
import { FIRST_NOTE } from "./lib/library";
import { MISSIONS, objectiveMet, levelFor, xpIntoLevel, type Mission } from "./missions";

const KEY = "rf-academy-progress";
type Progress = { completed: string[]; xp: number };
const loadProgress = (): Progress => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "") || { completed: [], xp: 0 };
  } catch {
    return { completed: [], xp: 0 };
  }
};

export default function App() {
  const { connected, frame } = useRf();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<"academy" | "mission" | "library" | "console">("academy");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState<string>(FIRST_NOTE);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  const active = useMemo(() => MISSIONS.find((m) => m.id === activeId) ?? null, [activeId]);
  const isDone = (id: string) => progress.completed.includes(id);
  const unlocked = (i: number) => i === 0 || isDone(MISSIONS[i - 1].id);

  const open = (m: Mission) => {
    setActiveId(m.id);
    setView("mission");
    tune(m.band.center_mhz, m.band.sample_rate_msps, m.band.gain_db);
  };
  const openNote = (slug: string) => {
    setNote(slug);
    setView("library");
  };
  const openMissionById = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id);
    if (m) open(m);
  };

  const complete = (m: Mission) => {
    if (isDone(m.id)) return;
    setProgress((p) => ({ completed: [...p.completed, m.id], xp: p.xp + m.xp }));
    setToast(`+${m.xp} XP — ${m.title} ✓`);
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-[1200px] flex-col gap-5 p-4 md:p-6">
      <Header connected={connected} frame={frame} xp={progress.xp} />

      <SdrBanner connected={connected} frame={frame} />

      <Tabs
        active={view === "library" ? "library" : view === "console" ? "console" : "missions"}
        onMissions={() => setView("academy")}
        onConsole={() => setView("console")}
        onLibrary={() => setView("library")}
      />

      {view === "console" ? (
        <Console frame={frame} onLearn={openNote} />
      ) : view === "library" ? (
        <Library slug={note} onSelect={openNote} onMission={openMissionById} />
      ) : view === "mission" && active ? (
        <MissionView
          m={active}
          frame={frame}
          done={isDone(active.id)}
          onComplete={() => complete(active)}
          onBack={() => setView("academy")}
          onLearn={openNote}
          onNext={() => {
            const i = MISSIONS.findIndex((x) => x.id === active.id);
            const nxt = MISSIONS[i + 1];
            if (nxt) open(nxt);
            else setView("academy");
          }}
        />
      ) : (
        <Academy done={progress.completed} unlocked={unlocked} onOpen={open} />
      )}

      <footer className="pb-2 text-center text-xs text-slate-600">
        RF Academy · HackRF · réception seule · {frame?.sim ? "mode simulateur (aucun SDR détecté)" : "SDR en direct"}
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-pulse rounded-full border border-phos bg-phos/15 px-5 py-2.5 font-display text-sm font-bold text-phos shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Header({ connected, frame, xp }: { connected: boolean; frame: Frame | null; xp: number }) {
  const lvl = levelFor(xp);
  const into = xpIntoLevel(xp);
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            RF<span className="text-phos">Academy</span>
          </h1>
          <span className="hidden text-sm text-muted sm:inline">la bible du HackRF, mission par mission</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-muted">
            <span className={`h-2 w-2 rounded-full ${connected ? "animate-pulse bg-phos" : "bg-rose-500"}`} />
            {connected ? (frame?.sim ? "sim" : "en direct") : "hors-ligne"}
          </span>
          <span className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-muted">
            🛡️ <b className="text-slate-200">Passif</b>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-phos/40 bg-phos/10 font-display text-sm font-bold text-phos">
          {lvl}
        </span>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted">
            <span>Niveau {lvl}</span>
            <span className="font-mono">{xp} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-edge">
            <div className="h-full rounded-full bg-gradient-to-r from-phos to-amber transition-all" style={{ width: `${(into / 250) * 100}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}

function Academy({
  done,
  unlocked,
  onOpen,
}: {
  done: string[];
  unlocked: (i: number) => boolean;
  onOpen: (m: Mission) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-edge bg-panel p-5">
        <h2 className="font-display text-lg font-bold">Bienvenue, opérateur·rice 📡</h2>
        <p className="mt-1 text-sm text-muted">
          Branche ton HackRF (ou reste en simulateur), puis enchaîne les missions : chacune t'apprend une
          bande, un concept, et te fait le repérer en direct. {done.length}/{MISSIONS.length} validées.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MISSIONS.map((m, i) => {
          const ok = done.includes(m.id);
          const open = unlocked(i);
          return (
            <button
              key={m.id}
              disabled={!open}
              onClick={() => onOpen(m)}
              className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
                ok
                  ? "border-phos/40 bg-phos/5"
                  : open
                    ? "border-edge bg-panel hover:border-phos/60"
                    : "cursor-not-allowed border-edge bg-panel/40 opacity-50"
              }`}
            >
              <div className="text-3xl">{open ? m.icon : "🔒"}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold">{m.title}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ok ? "bg-phos text-ink" : "border border-edge text-muted"}`}>
                    {ok ? "✓ fait" : `${m.xp} XP`}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{m.tagline}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">{m.band.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Which knowledge-base note pairs with each mission. */
const LEARN: Record<string, string> = {
  "first-contact": "ondes-radio",
  fm: "modulations",
  ism868: "bandes-a-explorer",
  wifi24: "modulations",
  drone: "decoder-vs-detecter",
};

function SdrBanner({ connected, frame }: { connected: boolean; frame: Frame | null }) {
  if (!connected || !frame) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-edge bg-panel p-4">
        <span className="text-2xl">🔌</span>
        <div className="text-sm text-muted">Connexion au moteur RF…</div>
      </div>
    );
  }
  const s = frame.sdr;
  if (s.present) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-phos/40 bg-phos/5 p-4">
        <span className="text-2xl">📡</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-phos">{s.label || "SDR"} détecté</div>
          <div className="truncate font-mono text-xs text-muted">
            {s.serial ? `n° de série ${s.serial}` : "n° de série indisponible"} · pilote {s.driver}
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-phos/40 px-3 py-1 text-xs font-semibold text-phos">EN DIRECT</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-amber/40 bg-amber/5 p-4">
      <span className="text-2xl">🔌</span>
      <div className="min-w-0 flex-1">
        <div className="font-display font-bold text-amber">Aucun SDR détecté</div>
        <div className="text-xs text-muted">
          Branche ton HackRF en USB — détection automatique en quelques secondes. En attendant : simulateur.
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-amber/40 px-3 py-1 text-xs font-semibold text-amber">SIMULATEUR</span>
    </div>
  );
}

function Tabs({
  active,
  onMissions,
  onConsole,
  onLibrary,
}: {
  active: "missions" | "console" | "library";
  onMissions: () => void;
  onConsole: () => void;
  onLibrary: () => void;
}) {
  const cls = (on: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
      on ? "bg-phos text-ink" : "border border-edge bg-panel text-slate-300 hover:border-phos"
    }`;
  return (
    <div className="flex flex-wrap gap-2">
      <button className={cls(active === "missions")} onClick={onMissions}>🎯 Missions</button>
      <button className={cls(active === "console")} onClick={onConsole}>🎛️ Console</button>
      <button className={cls(active === "library")} onClick={onLibrary}>📖 Bibliothèque</button>
    </div>
  );
}

function MissionView({
  m,
  frame,
  done,
  onComplete,
  onBack,
  onNext,
  onLearn,
}: {
  m: Mission;
  frame: Frame | null;
  done: boolean;
  onComplete: () => void;
  onBack: () => void;
  onNext: () => void;
  onLearn: (slug: string) => void;
}) {
  const met = objectiveMet(m, frame);
  const heldRef = useRef<number | null>(null);
  const [justWon, setJustWon] = useState(false);

  // auto-validate when the objective holds ~1.2s (except "observe" = manual)
  useEffect(() => {
    if (done || justWon || m.objective.kind === "observe") return;
    if (met) {
      if (heldRef.current == null) heldRef.current = window.setTimeout(() => {
        setJustWon(true);
        onComplete();
      }, 1200);
    } else if (heldRef.current != null) {
      clearTimeout(heldRef.current);
      heldRef.current = null;
    }
    return () => {
      if (heldRef.current != null) {
        clearTimeout(heldRef.current);
        heldRef.current = null;
      }
    };
  }, [met, done, justWon, m.objective.kind]); // eslint-disable-line

  const won = done || justWon;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted hover:text-phos">← toutes les missions</button>
        <button
          onClick={() => onLearn(LEARN[m.id] ?? "bienvenue")}
          className="rounded-lg border border-edge bg-panel px-3 py-1.5 text-sm text-slate-300 hover:border-phos"
        >
          📖 Lire la théorie
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
        {/* left — the bible + objective */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-edge bg-panel p-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{m.icon}</span>
              <div>
                <h2 className="font-display text-xl font-bold">{m.title}</h2>
                <p className="font-mono text-xs text-muted">{m.band.label}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-slate-300">
              {m.bible.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: mdBold(p) }} />
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border p-5 transition-colors ${won ? "border-phos/50 bg-phos/10" : met ? "border-amber/50 bg-amber/5" : "border-edge bg-panel"}`}>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Objectif</div>
            <p className="mt-1 text-sm">{m.goalText}</p>
            <div className="mt-3 flex items-center gap-3">
              {won ? (
                <>
                  <span className="font-display font-bold text-phos">✓ Mission validée · +{m.xp} XP</span>
                  <button onClick={onNext} className="ml-auto rounded-lg bg-phos px-4 py-2 text-sm font-semibold text-ink">Suivant →</button>
                </>
              ) : m.objective.kind === "observe" ? (
                <button onClick={onComplete} disabled={!frame} className="rounded-lg bg-phos px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">
                  J'ai repéré le bruit de fond ✓
                </button>
              ) : (
                <span className={`flex items-center gap-2 text-sm font-semibold ${met ? "text-amber" : "text-muted"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${met ? "animate-pulse bg-amber" : "bg-muted"}`} />
                  {met ? "signal détecté… maintiens-le" : "en recherche…"}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* right — live RF */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-edge bg-panel p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Spectre en direct</h3>
              <Stats frame={frame} />
            </div>
            <Spectrum frame={frame} />
          </div>
          <div className="rounded-2xl border border-edge bg-panel p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Cascade (waterfall) · le temps défile vers le bas</h3>
            <Waterfall frame={frame} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stats({ frame }: { frame: Frame | null }) {
  if (!frame) return <span className="font-mono text-xs text-muted">—</span>;
  return (
    <span className="flex gap-3 font-mono text-xs text-muted">
      <span>bruit <b className="text-slate-300">{frame.noise_floor_db.toFixed(0)}</b></span>
      <span>pic <b className="text-slate-300">{frame.peak_db.toFixed(0)}</b> dB</span>
      <span>occ <b className="text-slate-300">{(frame.occupancy * 100).toFixed(0)}</b>%</span>
    </span>
  );
}

/** minimal **bold** rendering for the bible text */
function mdBold(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<b class="text-slate-100">$1</b>');
}
