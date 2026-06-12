import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Spectrum from "./components/Spectrum";
import Waterfall from "./components/Waterfall";
import Library from "./components/Library";
import Console from "./components/Console";
import Quiz from "./components/Quiz";
import Journey from "./components/Journey";
import AircraftTable from "./components/Aircraft";

// Leaflet is heavy — only visitors who open the map pay for it
const MapView = lazy(() => import("./components/MapView"));
import { useRf, tune, type Frame } from "./lib/useRf";
import { FIRST_NOTE } from "./lib/library";
import { activate, isPro } from "./lib/license";
import { DONATE_URL } from "./lib/links";
import { useI18n, STR, type Locale } from "./lib/i18n";
import { markRead, readSlugs } from "./journey";
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

type View = "home" | "mission" | "library" | "console" | "exam" | "map";

export default function App() {
  const { t } = useI18n();
  const { connected, frame } = useRf();
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState<string>(FIRST_NOTE);
  const [toast, setToast] = useState<string | null>(null);
  const [pro, setPro] = useState(isPro);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [read, setRead] = useState<Set<string>>(readSlugs);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view, note, activeId]);

  const active = useMemo(() => MISSIONS.find((m) => m.id === activeId) ?? null, [activeId]);

  const openMission = (m: Mission) => {
    if (m.pro && !pro) {
      setShowUpgrade(true);
      return;
    }
    setActiveId(m.id);
    setView("mission");
    tune(m.band.center_mhz, m.band.sample_rate_msps, m.band.gain_db);
  };
  const openNote = (slug: string) => {
    setNote(slug);
    setView("library");
    markRead(slug);
    setRead(readSlugs());
  };
  const openMissionById = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id);
    if (m) openMission(m);
  };

  const complete = (m: Mission) => {
    if (progress.completed.includes(m.id)) return;
    setProgress((p) => ({ completed: [...p.completed, m.id], xp: p.xp + m.xp }));
    setToast(`+${m.xp} ${t(STR.toast.xp)} — ${t(m.title)} ✓`);
    setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-[1200px] flex-col gap-6 px-4 pb-10 pt-4 md:px-6">
      <Header
        connected={connected}
        frame={frame}
        xp={progress.xp}
        view={view}
        setView={setView}
        pro={pro}
        onUpgrade={() => setShowUpgrade(true)}
      />

      {view === "home" ? (
        <Journey
          frame={frame}
          read={read}
          completed={progress.completed}
          pro={pro}
          nav={{
            onMission: openMissionById,
            onNote: openNote,
            onExam: () => setView("exam"),
            onConsole: () => setView("console"),
          }}
        />
      ) : view === "console" ? (
        <>
          <SdrBanner connected={connected} frame={frame} />
          <Console frame={frame} onLearn={openNote} />
        </>
      ) : view === "map" ? (
        <Suspense fallback={<div className="rounded-2xl border border-edge bg-panel p-8 text-center text-sm text-muted">🗺️ …</div>}>
          <MapView frame={frame} />
        </Suspense>
      ) : view === "exam" ? (
        <Quiz pro={pro} onUpgrade={() => setShowUpgrade(true)} onLearn={openNote} />
      ) : view === "library" ? (
        <Library slug={note} onSelect={openNote} onMission={openMissionById} />
      ) : view === "mission" && active ? (
        <MissionView
          m={active}
          frame={frame}
          done={progress.completed.includes(active.id)}
          onComplete={() => complete(active)}
          onBack={() => setView("home")}
          onLearn={openNote}
          onNext={() => {
            const i = MISSIONS.findIndex((x) => x.id === active.id);
            const nxt = MISSIONS[i + 1];
            if (nxt) openMission(nxt);
            else setView("home");
          }}
        />
      ) : null}

      <footer className="mt-auto flex flex-wrap items-center justify-center gap-2 border-t border-edge/40 pt-5 text-center text-xs text-slate-600">
        <span>
          {t(STR.footer.line)} ·{" "}
          {frame?.sim ? t(STR.status.sim) : connected ? t(STR.status.live) : t(STR.status.offline)}
        </span>
        {pro ? (
          <span className="rounded-full border border-amber/40 px-2 py-0.5 font-semibold text-amber">PRO</span>
        ) : (
          <button onClick={() => setShowUpgrade(true)} className="text-phos underline-offset-2 hover:underline">
            {t(STR.pro.upgrade)}
          </button>
        )}
        <a href={DONATE_URL} target="_blank" rel="noreferrer" className="text-slate-500 underline-offset-2 hover:text-phos hover:underline">
          {t(STR.donate.coffee)}
        </a>
      </footer>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          onActivated={() => {
            setPro(true);
            setShowUpgrade(false);
            setToast(t(STR.pro.activated));
            setTimeout(() => setToast(null), 3200);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-pulse rounded-full border border-phos bg-phos/15 px-5 py-2.5 font-display text-sm font-bold text-phos shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ── header: identity · nav · language · status ─────────────────────────── */

function Header({
  connected,
  frame,
  xp,
  view,
  setView,
  pro,
  onUpgrade,
}: {
  connected: boolean;
  frame: Frame | null;
  xp: number;
  view: View;
  setView: (v: View) => void;
  pro: boolean;
  onUpgrade: () => void;
}) {
  const { t } = useI18n();
  const lvl = levelFor(xp);
  const into = xpIntoLevel(xp);
  const title = STR.level.titles[Math.min(lvl - 1, STR.level.titles.length - 1)];

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setView("home")} className="flex items-baseline gap-3 text-left">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            RF<span className="text-phos">Academy</span>
          </h1>
          <span className="hidden text-sm italic text-muted sm:inline">{t(STR.tagline)}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* always-visible source indicator: amber = simulator, green = real SDR */}
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold ${
              !connected
                ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                : frame?.sim
                  ? "border-amber/50 bg-amber/10 text-amber"
                  : "border-phos/50 bg-phos/10 text-phos"
            }`}
            title={frame?.sdr.serial ? `${t(STR.sdr.serial)} ${frame.sdr.serial}` : undefined}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                !connected ? "bg-rose-500" : frame?.sim ? "bg-amber" : "animate-pulse-dot bg-phos"
              }`}
            />
            {!connected
              ? t(STR.status.offline)
              : frame?.sim
                ? `🔌 ${t(STR.status.sim)}`
                : `📡 ${frame?.sdr.label || "SDR"} · ${t(STR.status.live)}`}
          </span>
          <span className="hidden rounded-full border border-edge bg-panel px-3 py-1.5 text-xs text-muted lg:inline">
            🛡️ {t(STR.status.passive)}
          </span>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-edge bg-panel px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-phos hover:text-phos"
          >
            ☕ {t(STR.donate.support)}
          </a>
          {pro ? (
            <span className="rounded-full border border-amber/50 bg-amber/10 px-3 py-1.5 text-xs font-bold text-amber">
              PRO
            </span>
          ) : (
            <button
              onClick={onUpgrade}
              className="rounded-full border border-amber/40 px-3 py-1.5 text-xs font-semibold text-amber transition-colors hover:bg-amber/10"
            >
              {t(STR.pro.upgrade)}
            </button>
          )}
          <LangSwitch />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2">
          <Tab on={view === "home"} onClick={() => setView("home")} label={`🧭 ${t(STR.nav.journey)}`} />
          <Tab on={view === "console"} onClick={() => setView("console")} label={`🎛️ ${t(STR.nav.explore)}`} />
          <Tab on={view === "map"} onClick={() => setView("map")} label={`🗺️ ${t(STR.nav.map)}`} />
          <Tab on={view === "exam"} onClick={() => setView("exam")} label={`🎓 ${t(STR.nav.exam)}`} />
          <Tab on={view === "library"} onClick={() => setView("library")} label={`📖 ${t(STR.nav.library)}`} />
        </nav>

        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-phos/40 bg-phos/10 font-display text-xs font-bold text-phos">
            {lvl}
          </span>
          <div className="w-36">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
              <span className="truncate">{t(title)}</span>
              <span className="font-mono">{xp}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-gradient-to-r from-phos to-amber transition-all"
                style={{ width: `${(into / 250) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Tab({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        on ? "bg-phos text-ink" : "border border-edge bg-panel text-slate-300 hover:border-phos"
      }`}
    >
      {label}
    </button>
  );
}

function LangSwitch() {
  const { locale, setLocale } = useI18n();
  const opt = (l: Locale) => (
    <button
      onClick={() => setLocale(l)}
      className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase transition-colors ${
        locale === l ? "bg-phos text-ink" : "text-muted hover:text-slate-200"
      }`}
      aria-pressed={locale === l}
    >
      {l}
    </button>
  );
  return (
    <span className="flex items-center gap-0.5 rounded-lg border border-edge bg-panel p-0.5">
      {opt("fr")}
      {opt("en")}
    </span>
  );
}

/* ── SDR banner (console view): status + WebUSB connect ──────────────────── */

function SdrBanner({ connected, frame }: { connected: boolean; frame: Frame | null }) {
  const { t } = useI18n();
  const [usbOk, setUsbOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    import("./lib/webusb").then(({ usbSupported }) => setUsbOk(usbSupported()));
  }, []);

  const plug = async () => {
    setBusy(true);
    setErr(null);
    try {
      const { usbConnect } = await import("./lib/webusb");
      await usbConnect();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const unplug = async () => {
    const { usbDisconnect } = await import("./lib/webusb");
    await usbDisconnect();
  };

  if (!connected || !frame) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-edge bg-panel p-4">
        <span className="text-2xl">🔌</span>
        <div className="text-sm text-muted">{t(STR.status.connecting)}</div>
      </div>
    );
  }
  const s = frame.sdr;
  const viaUsb = s.driver === "rtlsdr-webusb";
  if (s.present) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-phos/40 bg-phos/5 p-4">
        <span className="text-2xl">📡</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-phos">
            {s.label || "SDR"} {t(STR.sdr.detected)}
          </div>
          <div className="truncate font-mono text-xs text-muted">
            {viaUsb
              ? t(STR.usb.active)
              : `${s.serial ? `${t(STR.sdr.serial)} ${s.serial}` : t(STR.sdr.noSerial)} · ${t(STR.sdr.driver)} ${s.driver}`}
          </div>
        </div>
        {viaUsb && (
          <button
            onClick={unplug}
            className="shrink-0 rounded-lg border border-edge px-3 py-1.5 text-xs text-slate-300 hover:border-rose-500 hover:text-rose-400"
          >
            {t(STR.usb.disconnect)}
          </button>
        )}
        <span className="shrink-0 rounded-full border border-phos/40 px-3 py-1 text-xs font-semibold text-phos">
          {t(STR.sdr.liveBadge)}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber/40 bg-amber/5 p-4">
      <div className="flex items-center gap-4">
        <span className="text-2xl">🔌</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-amber">{t(STR.sdr.none)}</div>
          <div className="text-xs text-muted">{usbOk ? t(STR.usb.hint) : t(STR.usb.unsupported)}</div>
        </div>
        <span className="shrink-0 rounded-full border border-amber/40 px-3 py-1 text-xs font-semibold text-amber">
          {t(STR.sdr.simBadge)}
        </span>
      </div>
      {usbOk && (
        <button
          onClick={plug}
          disabled={busy}
          className="self-start rounded-lg bg-phos px-4 py-2 text-sm font-bold text-ink transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? "…" : t(STR.usb.connect)}
        </button>
      )}
      {err && (
        <p className="text-xs text-rose-400">
          {t(STR.usb.error)} {err}
        </p>
      )}
    </div>
  );
}

/* ── mission view ────────────────────────────────────────────────────────── */

/** Which knowledge-base note pairs with each mission. */
const LEARN: Record<string, string> = {
  "first-contact": "ondes-radio",
  fm: "modulations",
  ism868: "bandes-a-explorer",
  wifi24: "modulations",
  adsb: "decoder-vs-detecter",
  drone: "decoder-vs-detecter",
};

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
  const { t } = useI18n();
  const met = objectiveMet(m, frame);
  const heldRef = useRef<number | null>(null);
  const [justWon, setJustWon] = useState(false);

  // auto-validate when the objective holds ~1.2s (except "observe" = manual)
  useEffect(() => {
    if (done || justWon || m.objective.kind === "observe") return;
    if (met) {
      if (heldRef.current == null)
        heldRef.current = window.setTimeout(() => {
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
        <button onClick={onBack} className="text-sm text-muted hover:text-phos">
          {t(STR.mission.all)}
        </button>
        <button
          onClick={() => onLearn(LEARN[m.id] ?? "bienvenue")}
          className="rounded-lg border border-edge bg-panel px-3 py-1.5 text-sm text-slate-300 hover:border-phos"
        >
          📖 {t(STR.mission.theory)}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
        {/* left — the brief + objective */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-edge bg-panel p-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{m.icon}</span>
              <div>
                <h2 className="font-display text-xl font-bold">{t(m.title)}</h2>
                <p className="font-mono text-xs text-muted">{m.band.label}</p>
              </div>
            </div>
            <div className="prose-radio mt-4 flex flex-col gap-3 text-[15px] leading-[1.75] text-slate-300">
              {m.bible.map((p, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: mdBold(t(p)) }} />
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 transition-colors ${
              won ? "border-phos/50 bg-phos/10" : met ? "border-amber/50 bg-amber/5" : "border-edge bg-panel"
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t(STR.mission.objective)}
            </div>
            <p className="mt-1 text-sm">{t(m.goalText)}</p>
            <div className="mt-3 flex items-center gap-3">
              {won ? (
                <>
                  <span className="font-display font-bold text-phos">
                    ✓ {t(STR.mission.validated)} · +{m.xp} XP
                  </span>
                  <button onClick={onNext} className="ml-auto rounded-lg bg-phos px-4 py-2 text-sm font-semibold text-ink">
                    {t(STR.mission.next)}
                  </button>
                </>
              ) : m.objective.kind === "observe" ? (
                <button
                  onClick={onComplete}
                  disabled={!frame}
                  className="rounded-lg bg-phos px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
                >
                  {t(STR.mission.observed)}
                </button>
              ) : (
                <span className={`flex items-center gap-2 text-sm font-semibold ${met ? "text-amber" : "text-muted"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${met ? "animate-pulse bg-amber" : "bg-muted"}`} />
                  {met ? t(STR.mission.holding) : t(STR.mission.searching)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* right — live instruments */}
        <section className="flex flex-col gap-4">
          <div className="crt border border-edge/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.mission.liveSpectrum)}</h3>
              <Stats frame={frame} />
            </div>
            <Spectrum frame={frame} />
          </div>
          {m.objective.kind === "aircraft" && (
            <div className="rounded-2xl border border-edge bg-panel p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                ✈️ {t(STR.mission.aircraft)}
              </h3>
              <AircraftTable list={frame?.aircraft ?? []} />
            </div>
          )}
          <div className="crt border border-edge/70 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.mission.waterfall)}</h3>
            <Waterfall frame={frame} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stats({ frame }: { frame: Frame | null }) {
  const { t } = useI18n();
  if (!frame) return <span className="font-mono text-xs text-muted">—</span>;
  return (
    <span className="flex gap-3 font-mono text-xs text-muted">
      <span>
        {t(STR.mission.noise)} <b className="text-slate-300">{frame.noise_floor_db.toFixed(0)}</b>
      </span>
      <span>
        {t(STR.mission.peak)} <b className="text-slate-300">{frame.peak_db.toFixed(0)}</b> dB
      </span>
      <span>
        {t(STR.mission.occ)} <b className="text-slate-300">{(frame.occupancy * 100).toFixed(0)}</b>%
      </span>
    </span>
  );
}

/* ── Pro modal ───────────────────────────────────────────────────────────── */

function UpgradeModal({ onClose, onActivated }: { onClose: () => void; onActivated: () => void }) {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [err, setErr] = useState(false);
  const tryActivate = () => {
    if (activate(key)) onActivated();
    else setErr(true);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-amber/40 bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-bold">
          RF Academy <span className="text-amber">{t(STR.pro.title2)}</span>
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-300">
          <li>✈️ {t(STR.pro.f1)}</li>
          <li>🚁 {t(STR.pro.f2)}</li>
          <li>⏱️ {t(STR.pro.f3)}</li>
          <li>❤️ {t(STR.pro.f4)}</li>
        </ul>

        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-5 block rounded-lg bg-amber px-5 py-2.5 text-center text-sm font-bold text-ink transition-transform hover:scale-[1.02]"
        >
          {t(STR.pro.getKey)}
        </a>
        <p className="mt-2 text-center text-xs text-muted">{t(STR.pro.getKeyHint)}</p>

        <div className="mt-5 border-t border-edge/60 pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t(STR.pro.haveKey)}</div>
          <div className="flex gap-2">
            <input
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setErr(false);
              }}
              placeholder={t(STR.pro.placeholder)}
              className={`min-w-0 flex-1 rounded-lg border bg-ink px-3 py-2 font-mono text-sm outline-none ${
                err ? "border-rose-500" : "border-edge focus:border-amber"
              }`}
            />
            <button onClick={tryActivate} className="shrink-0 rounded-lg border border-amber/60 px-4 py-2 text-sm font-semibold text-amber hover:bg-amber/10">
              {t(STR.pro.activate)}
            </button>
          </div>
          {err && <p className="mt-1 text-xs text-rose-400">{t(STR.pro.invalid)}</p>}
        </div>

        <div className="mt-4 text-center">
          <button onClick={onClose} className="text-sm text-muted hover:text-slate-300">
            {t(STR.pro.later)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** minimal **bold** rendering for the mission brief */
function mdBold(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<b class="text-slate-100">$1</b>');
}
