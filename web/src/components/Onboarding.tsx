import { useState } from "react";
import Icon, { type IconName } from "./Icon";
import { useI18n, STR } from "../lib/i18n";

const FLAG = "ohz-onboarded";

export function onboarded(): boolean {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return true; // storage blocked → don't nag
  }
}
function markOnboarded() {
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore */
  }
}

/** One-time first-visit chooser. Skippable in one click, never shown again. */
export default function Onboarding({
  onConsole,
  onNote,
  onClose,
}: {
  onConsole: () => void;
  onNote: (slug: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [closing, setClosing] = useState(false);

  const done = (then?: () => void) => {
    markOnboarded();
    setClosing(true);
    then?.();
    onClose();
  };
  if (closing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
      <div className="crt w-full max-w-2xl rounded-2xl border border-edge/70 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-phos">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-phos" />
          OpenHertz
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-50">
          {t(STR.onboard.title)}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{t(STR.onboard.sub)}</p>

        <div className="mt-6 flex flex-col gap-3">
          <Card
            icon="plug"
            tone="phos"
            title={t(STR.onboard.haveSdr)}
            sub={t(STR.onboard.haveSdrSub)}
            onClick={() => done(onConsole)}
          />
          <Card
            icon="flask"
            tone="amber"
            title={t(STR.onboard.haveNothing)}
            sub={t(STR.onboard.haveNothingSub)}
            onClick={() => done()}
            cta={t(STR.onboard.startJourney)}
          />
          <Card
            icon="book"
            tone="slate"
            title={t(STR.onboard.whatIsThis)}
            sub={t(STR.onboard.whatIsThisSub)}
            onClick={() => done(() => onNote("bienvenue"))}
          />
        </div>

        <div className="mt-5 text-center">
          <button onClick={() => done()} className="text-sm text-muted hover:text-slate-300">
            {t(STR.onboard.skip)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  tone,
  title,
  sub,
  cta,
  onClick,
}: {
  icon: IconName;
  tone: "phos" | "amber" | "slate";
  title: string;
  sub: string;
  cta?: string;
  onClick: () => void;
}) {
  const ring =
    tone === "phos"
      ? "hover:border-phos/60 hover:ring-phos/30"
      : tone === "amber"
        ? "hover:border-amber/60 hover:ring-amber/30"
        : "hover:border-slate-500 hover:ring-slate-500/20";
  const ic = tone === "phos" ? "text-phos" : tone === "amber" ? "text-amber" : "text-slate-300";
  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-4 rounded-xl border border-edge bg-panel/80 p-4 text-left transition-all hover:ring-1 ${ring}`}
    >
      <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-edge bg-ink ${ic}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display font-bold text-slate-100">
          {title}
          {cta && (
            <span className="rounded-full border border-amber/50 bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber">
              {cta}
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{sub}</span>
      </span>
      <Icon name="compass" size={16} className="mt-1 shrink-0 text-muted transition-colors group-hover:text-phos" />
    </button>
  );
}
