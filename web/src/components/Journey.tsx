import Spectrum from "./Spectrum";
import Icon, { type IconName } from "./Icon";
import type { Frame } from "../lib/useRf";
import type { UsbCaps } from "../lib/webusb";
import { useI18n, STR } from "../lib/i18n";
import { STAGES, stageProgress, stageUnlocked, stepDone, missionById, type Stage, type Step } from "../journey";
import { missionInRange } from "../missions";
import { titleOf } from "../lib/library";

type Nav = {
  onMission: (id: string) => void;
  onNote: (slug: string) => void;
  onExam: () => void;
  onConsole: () => void;
};

/** Home: the living hero (real sky, right now) + the five-stage journey. */
export default function Journey({
  frame,
  read,
  completed,
  caps,
  nav,
}: {
  frame: Frame | null;
  read: Set<string>;
  completed: string[];
  caps: UsbCaps | null;
  nav: Nav;
}) {
  const { t } = useI18n();

  // the next thing to do — powers the hero CTA
  const next = (() => {
    for (let i = 0; i < STAGES.length; i++) {
      if (!stageUnlocked(i, read, completed)) break;
      for (const s of STAGES[i].steps) {
        if (!stepDone(s, read, completed)) return { stage: STAGES[i], step: s };
      }
    }
    return null;
  })();
  const started = completed.length > 0 || read.size > 0;

  const go = (step: Step) => {
    if (step.kind === "note") nav.onNote(step.slug);
    else if (step.kind === "mission") nav.onMission(step.id);
    else nav.onExam();
  };

  return (
    <div className="flex flex-col gap-12">
      {/* ── hero ─────────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-8 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="rise">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-phos">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-phos" />
            {t(STR.hero.over)}
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl">
            {t(STR.hero.title1)}
            <br />
            <span className="bg-gradient-to-r from-phos to-signal bg-clip-text text-transparent">
              {t(STR.hero.title2)}
            </span>
          </h1>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-slate-400">{t(STR.hero.sub)}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              onClick={() => (next ? go(next.step) : nav.onConsole())}
              className="rounded-xl bg-phos px-6 py-3 font-display text-sm font-bold text-ink shadow-[0_0_30px_rgba(74,242,200,.25)] transition-transform hover:scale-[1.03]"
            >
              {started ? t(STR.hero.ctaContinue) : t(STR.hero.cta)}
            </button>
            <button onClick={nav.onConsole} className="text-sm text-muted transition-colors hover:text-phos">
              {t(STR.hero.ctaExplore)}
            </button>
          </div>
        </div>

        {/* the sky, live */}
        <div className="crt rise border border-edge/70 p-4" style={{ animationDelay: "120ms" }}>
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-muted">
            <span>
              {t(STR.hero.listening)}{" "}
              <b className="text-phos">{frame ? `${frame.center_mhz.toFixed(1)} MHz` : "—"}</b>
            </span>
            <span className={frame?.sim ? "text-amber" : "text-phos"}>
              {frame ? (frame.sim ? t(STR.sdr.simBadge) : t(STR.sdr.liveBadge)) : "…"}
            </span>
          </div>
          <Spectrum frame={frame} />
          <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <Tele label={t(STR.hero.noise)} value={frame ? `${frame.noise_floor_db.toFixed(0)} dB` : "—"} />
            <Tele
              label={t(STR.hero.strongest)}
              value={frame?.peaks[0] ? `${frame.peaks[0].center_mhz.toFixed(1)} MHz` : "—"}
              accent
            />
            <Tele label={t(STR.hero.occupancy)} value={frame ? `${(frame.occupancy * 100).toFixed(0)} %` : "—"} />
          </div>
        </div>
      </section>

      {/* ── the journey ──────────────────────────────────────────────────── */}
      <section>
        <div className="mb-8">
          <h2 className="font-display text-2xl font-bold tracking-tight">{t(STR.journey.title)}</h2>
          <p className="mt-1 max-w-[64ch] text-sm text-muted">{t(STR.journey.sub)}</p>
        </div>

        <ol className="relative flex flex-col gap-6">
          {/* the dial spine */}
          <div className="ruler absolute bottom-6 left-[27px] top-2 hidden w-px sm:block" aria-hidden />
          {STAGES.map((stage, i) => (
            <StageRow
              key={stage.id}
              index={i}
              stage={stage}
              unlocked={stageUnlocked(i, read, completed)}
              progress={stageProgress(stage, read, completed)}
              read={read}
              completed={completed}
              caps={caps}
              onStep={go}
            />
          ))}
        </ol>
      </section>
    </div>
  );
}

function Tele({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-edge/60 bg-ink/60 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-0.5 truncate text-[13px] font-semibold ${accent ? "text-amber" : "text-slate-200"}`}>
        {value}
      </div>
    </div>
  );
}

function StageRow({
  index,
  stage,
  unlocked,
  progress,
  read,
  completed,
  caps,
  onStep,
}: {
  index: number;
  stage: Stage;
  unlocked: boolean;
  progress: number;
  read: Set<string>;
  completed: string[];
  caps: UsbCaps | null;
  onStep: (s: Step) => void;
}) {
  const { t, locale } = useI18n();
  const pct = Math.round(progress * 100);
  const complete = progress >= 1;

  return (
    <li className="rise flex gap-4 sm:gap-6" style={{ animationDelay: `${180 + index * 90}ms` }}>
      {/* node + ring */}
      <div className="relative hidden shrink-0 sm:block">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r="25" fill="#0b121c" stroke="#1b2937" strokeWidth="2.5" />
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke={complete ? "#4af2c8" : "#ffb454"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${progress * 157} 157`}
            className="transition-all duration-700"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center ${complete ? "text-phos" : "text-amber"}`}>
          <Icon name={unlocked ? stage.icon : "lock"} size={22} />
        </span>
      </div>

      {/* card */}
      <div
        className={`min-w-0 flex-1 rounded-2xl border p-5 transition-colors ${
          complete
            ? "border-phos/30 bg-phos/[0.04]"
            : unlocked
              ? "border-edge bg-panel hover:border-edge/0 hover:ring-1 hover:ring-phos/40"
              : "border-edge/60 bg-panel/40"
        }`}
      >
        <div className={unlocked ? "" : "opacity-45"}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                {t(STR.journey.chapterLabel)} {index + 1} · <span className="text-amber">{stage.dial}</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted">
              {pct} % {t(STR.journey.progress)}
            </span>
          </div>
          <h3 className="mt-1 flex items-center gap-2 font-display text-lg font-bold">
            <Icon name={unlocked ? stage.icon : "lock"} size={18} className="text-amber sm:hidden" />
            {t(stage.title)}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t(stage.hook)}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {stage.steps.map((step, k) => (
              <StepChip
                key={k}
                step={step}
                done={stepDone(step, read, completed)}
                disabled={!unlocked}
                caps={caps}
                locale={locale}
                onClick={() => unlocked && onStep(step)}
              />
            ))}
          </div>
        </div>
        {!unlocked && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber/80">
            <Icon name="lock" size={12} /> {t(STR.journey.locked)}
          </p>
        )}
      </div>
    </li>
  );
}

function StepChip({
  step,
  done,
  disabled,
  caps,
  locale,
  onClick,
}: {
  step: Step;
  done: boolean;
  disabled: boolean;
  caps: UsbCaps | null;
  locale: "fr" | "en";
  onClick: () => void;
}) {
  const { t } = useI18n();
  let icon: IconName = "book";
  let label = "";
  let needsHackrf = false;
  if (step.kind === "note") {
    label = titleOf(step.slug, locale);
  } else if (step.kind === "mission") {
    const m = missionById(step.id);
    icon = "target";
    label = m ? t(m.title) : step.id;
    // only flag when a real device is plugged in that can't reach the band —
    // on the simulator everything works, so no scary badge
    needsHackrf = !!m && !!caps && !missionInRange(m, caps);
  } else {
    icon = "cap";
    label = t(STR.quiz.exam);
  }

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
        done
          ? "border-phos/40 bg-phos/10 text-phos"
          : "border-edge bg-ink/50 text-slate-300 hover:border-phos/50 hover:text-phos"
      } ${disabled ? "cursor-not-allowed" : ""}`}
    >
      <Icon name={done ? "check" : icon} size={12} />
      <span className="max-w-[24ch] truncate">{label}</span>
      {needsHackrf && (
        <span className="ml-0.5 rounded-full border border-amber/50 bg-amber/10 px-1.5 text-[9px] font-bold uppercase text-amber">
          HackRF
        </span>
      )}
    </button>
  );
}
