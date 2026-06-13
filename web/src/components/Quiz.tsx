import { useEffect, useMemo, useState } from "react";
import Icon from "./Icon";
import { byCategory, shuffled, CATEGORY_LABEL, QUESTIONS, type Category, type Question } from "../quiz";
import { useI18n, STR, fmt } from "../lib/i18n";
import { track } from "../lib/analytics";
import { EXAM_DONE_KEY } from "../journey";

// ── Répétition espacée (Leitner) ─────────────────────────────────────────────
// box 0 = nouvelle/ratée … box 4 = acquise ; chaque succès espace la revue.

const SRS_KEY = "rfa-quiz-v1";
const BOX_DAYS = [0, 1, 3, 7, 16];
type SrsState = Record<string, { box: number; due: number }>;

const loadSrs = (): SrsState => {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY) || "{}");
  } catch {
    return {};
  }
};

// ── Examen blanc ─────────────────────────────────────────────────────────────
const EXAM_MINUTES = 30;
const PASS_RATIO = 0.5; // ≥ la moitié dans chaque domaine, comme à l'ANFR

type ExamState = {
  questions: Question[];
  /** Per-question display order of the choices — authored data always lists
      the correct answer first, so it must never be shown unshuffled. */
  order: Record<string, number[]>;
  answers: Record<string, number>;
  endsAt: number;
  finished: boolean;
};

/** Shuffled display order for a question's choices (indices into q.choices). */
const choiceOrder = (q: Question) => shuffled(q.choices.map((_, i) => i));

export default function Quiz({ onLearn }: { onLearn: (slug: string) => void }) {
  const [mode, setMode] = useState<"menu" | "train" | "exam">("menu");

  return (
    <div className="flex flex-col gap-4">
      {mode === "menu" && <Menu onTrain={() => setMode("train")} onExam={() => setMode("exam")} />}
      {mode === "train" && <Train onBack={() => setMode("menu")} onLearn={onLearn} />}
      {mode === "exam" && <Exam onBack={() => setMode("menu")} onLearn={onLearn} />}
    </div>
  );
}

function srsStats() {
  const srs = loadSrs();
  let acquired = 0,
    learning = 0;
  for (const q of QUESTIONS) {
    const s = srs[q.id];
    if (!s) continue;
    if (s.box >= 3) acquired++;
    else learning++;
  }
  return { acquired, learning, fresh: QUESTIONS.length - acquired - learning };
}

function Menu({ onTrain, onExam }: { onTrain: () => void; onExam: () => void }) {
  const { t } = useI18n();
  const stats = useMemo(srsStats, []);
  return (
    <>
      <div className="rise rounded-2xl border border-edge bg-panel p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Icon name="cap" size={20} className="text-phos" /> {t(STR.quiz.title)}
        </h2>
        <p className="mt-1 text-sm text-muted">{fmt(t(STR.quiz.intro), { n: QUESTIONS.length })}</p>
        <p className="mt-2 font-mono text-xs text-muted">
          <b className="text-phos">{stats.acquired}</b> {t(STR.quiz.acquired)} ·{" "}
          <b className="text-amber">{stats.learning}</b> {t(STR.quiz.learning)} ·{" "}
          <b className="text-slate-300">{stats.fresh}</b> {t(STR.quiz.fresh)}
        </p>
        <p className="mt-1 text-[11px] text-slate-600">{t(STR.quiz.frNote)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={onTrain}
          className="rise rounded-2xl border border-edge bg-panel p-5 text-left transition-colors hover:border-phos/60"
          style={{ animationDelay: "80ms" }}
        >
          <Icon name="book" size={26} className="text-phos" />
          <h3 className="mt-2 font-display font-bold">{t(STR.quiz.train)}</h3>
          <p className="mt-1 text-sm text-muted">{t(STR.quiz.trainSub)}</p>
        </button>
        <button
          onClick={onExam}
          className="rise relative rounded-2xl border border-edge bg-panel p-5 text-left transition-colors hover:border-amber/60"
          style={{ animationDelay: "140ms" }}
        >
          <Icon name="trophy" size={26} className="text-amber" />
          <h3 className="mt-2 font-display font-bold">{t(STR.quiz.exam)}</h3>
          <p className="mt-1 text-sm text-muted">
            {fmt(t(STR.quiz.examSub), { n: QUESTIONS.length, m: EXAM_MINUTES })}
          </p>
        </button>
      </div>
    </>
  );
}

// ── Mode révision ────────────────────────────────────────────────────────────

function Train({ onBack, onLearn }: { onBack: () => void; onLearn: (slug: string) => void }) {
  const { t } = useI18n();
  const [queue, setQueue] = useState<Question[]>(() => {
    const srs = loadSrs();
    const now = Date.now();
    const due = QUESTIONS.filter((q) => srs[q.id] && srs[q.id].due <= now);
    const fresh = QUESTIONS.filter((q) => !srs[q.id]);
    const later = QUESTIONS.filter((q) => srs[q.id] && srs[q.id].due > now);
    return [...shuffled(due), ...shuffled(fresh), ...shuffled(later)];
  });
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, ko: 0 });

  const q = queue[idx % queue.length];

  const answer = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    const ok = i === q.answer;
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), ko: s.ko + (ok ? 0 : 1) }));
    const srs = loadSrs();
    const cur = srs[q.id]?.box ?? 0;
    const box = ok ? Math.min(cur + 1, BOX_DAYS.length - 1) : 0;
    srs[q.id] = { box, due: Date.now() + BOX_DAYS[box] * 86_400_000 };
    localStorage.setItem(SRS_KEY, JSON.stringify(srs));
  };

  const next = () => {
    setPicked(null);
    if ((idx + 1) % queue.length === 0) setQueue(shuffled(queue));
    setIdx(idx + 1);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted hover:text-phos">
          {t(STR.quiz.back)}
        </button>
        <span className="font-mono text-xs text-muted">
          <b className="text-phos">{score.ok}</b> ✓ · <b className="text-rose-400">{score.ko}</b> ✗
        </span>
      </div>
      <QuestionCard q={q} picked={picked} onPick={answer} onLearn={onLearn} />
      {picked != null && (
        <button onClick={next} className="self-end rounded-lg bg-phos px-5 py-2 text-sm font-semibold text-ink">
          {t(STR.quiz.nextQ)}
        </button>
      )}
    </>
  );
}

// ── Examen blanc ─────────────────────────────────────────────────────────────

function Exam({ onBack, onLearn }: { onBack: () => void; onLearn: (slug: string) => void }) {
  const { t } = useI18n();
  const [exam, setExam] = useState<ExamState>(() => {
    const questions = [...shuffled(byCategory("reglementation")), ...shuffled(byCategory("technique"))];
    return {
      questions,
      order: Object.fromEntries(questions.map((q) => [q.id, choiceOrder(q)])),
      answers: {},
      endsAt: Date.now() + EXAM_MINUTES * 60_000,
      finished: false,
    };
  });
  const [, tick] = useState(0);

  useEffect(() => {
    track("exam_started");
  }, []);

  // horloge
  useEffect(() => {
    if (exam.finished) return;
    const h = setInterval(() => {
      if (Date.now() >= exam.endsAt) setExam((e) => ({ ...e, finished: true }));
      else tick((x) => x + 1);
    }, 1000);
    return () => clearInterval(h);
  }, [exam.finished, exam.endsAt]);

  const remaining = Math.max(0, exam.endsAt - Date.now());
  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);

  if (exam.finished) {
    const score = (cat: Category) => {
      const qs = exam.questions.filter((q) => q.cat === cat);
      const ok = qs.filter((q) => exam.answers[q.id] === q.answer).length;
      return { ok, total: qs.length, pass: ok >= qs.length * PASS_RATIO };
    };
    const reg = score("reglementation");
    const tec = score("technique");
    const passed = reg.pass && tec.pass;
    if (passed && localStorage.getItem(EXAM_DONE_KEY) !== "1") {
      localStorage.setItem(EXAM_DONE_KEY, "1"); // journey checkpoint (fire once)
      track("exam_passed");
    }
    const wrong = exam.questions.filter((q) => exam.answers[q.id] !== q.answer);
    return (
      <>
        <div
          className={`rounded-2xl border p-6 text-center ${passed ? "border-phos/50 bg-phos/10" : "border-rose-500/50 bg-rose-500/5"}`}
        >
          <Icon name={passed ? "trophy" : "book"} size={36} className={`mx-auto ${passed ? "text-phos" : "text-amber"}`} />
          <h2 className="mt-2 font-display text-xl font-bold">{passed ? t(STR.quiz.passed) : t(STR.quiz.failed)}</h2>
          <p className="mt-2 font-mono text-sm text-slate-300">
            {t(CATEGORY_LABEL.reglementation)} : {reg.ok}/{reg.total} {reg.pass ? "✓" : "✗"} ·{" "}
            {t(CATEGORY_LABEL.technique)} : {tec.ok}/{tec.total} {tec.pass ? "✓" : "✗"}
          </p>
          <p className="mt-1 text-xs text-muted">{t(STR.quiz.threshold)}</p>
          <button onClick={onBack} className="mt-4 rounded-lg bg-phos px-5 py-2 text-sm font-semibold text-ink">
            {t(STR.quiz.backBtn)}
          </button>
        </div>
        {wrong.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-bold">
              {t(STR.quiz.review)} ({wrong.length})
            </h3>
            {wrong.map((q) => (
              <QuestionCard key={q.id} q={q} picked={exam.answers[q.id] ?? null} onPick={() => {}} onLearn={onLearn} review />
            ))}
          </div>
        )}
      </>
    );
  }

  const answered = Object.keys(exam.answers).length;
  return (
    <>
      <div className="sticky top-2 z-10 flex items-center justify-between rounded-xl border border-edge bg-panel/95 px-4 py-2 backdrop-blur">
        <button onClick={onBack} className="text-sm text-muted hover:text-phos">
          {t(STR.quiz.abandon)}
        </button>
        <span className="font-mono text-sm">
          {answered}/{exam.questions.length} ·{" "}
          <b className={remaining < 5 * 60_000 ? "text-rose-400" : "text-phos"}>
            {mm}:{ss.toString().padStart(2, "0")}
          </b>
        </span>
        <button
          onClick={() => setExam((e) => ({ ...e, finished: true }))}
          className="rounded-lg bg-phos px-4 py-1.5 text-sm font-semibold text-ink"
        >
          {t(STR.quiz.finish)}
        </button>
      </div>
      {exam.questions.map((q, i) => (
        <div key={q.id} className="rounded-2xl border border-edge bg-panel p-5">
          <p className="text-sm">
            <span className="font-mono text-xs text-muted">
              {i + 1}. [{t(CATEGORY_LABEL[q.cat])}]
            </span>{" "}
            {t(q.q)}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(exam.order[q.id] ?? q.choices.map((_, k) => k)).map((ci) => (
              <button
                key={ci}
                onClick={() => setExam((e) => ({ ...e, answers: { ...e.answers, [q.id]: ci } }))}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  exam.answers[q.id] === ci ? "border-phos bg-phos/10 text-phos" : "border-edge bg-ink hover:border-phos/50"
                }`}
              >
                {t(q.choices[ci])}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={() => setExam((e) => ({ ...e, finished: true }))}
        className="self-center rounded-lg bg-phos px-6 py-2.5 text-sm font-semibold text-ink"
      >
        {t(STR.quiz.finishExam)}
      </button>
    </>
  );
}

// ── Carte question partagée ──────────────────────────────────────────────────

function QuestionCard({
  q,
  picked,
  onPick,
  onLearn,
  review = false,
}: {
  q: Question;
  picked: number | null;
  onPick: (i: number) => void;
  onLearn: (slug: string) => void;
  review?: boolean;
}) {
  const { t } = useI18n();
  const revealed = review || picked != null;
  // never present the choices in authored order (the correct one comes first)
  const order = useMemo(() => choiceOrder(q), [q.id]); // eslint-disable-line
  return (
    <div className="rounded-2xl border border-edge bg-panel p-5">
      <span className="rounded-full border border-edge px-2 py-0.5 text-[11px] text-muted">
        {t(CATEGORY_LABEL[q.cat])}
      </span>
      <p className="mt-2 text-sm leading-relaxed">{t(q.q)}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {order.map((i) => {
          let cls = "border-edge bg-ink hover:border-phos/50";
          if (revealed) {
            if (i === q.answer) cls = "border-phos bg-phos/10 text-phos";
            else if (i === picked) cls = "border-rose-500 bg-rose-500/10 text-rose-300";
            else cls = "border-edge bg-ink opacity-60";
          }
          return (
            <button
              key={i}
              disabled={revealed && !review}
              onClick={() => onPick(i)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}
            >
              {t(q.choices[i])}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-edge bg-ink p-3 text-sm text-slate-300">
          <Icon name="spark" size={15} className="mt-0.5 shrink-0 text-amber" />
          <span>
            {t(q.why)}{" "}
            {q.note && (
              <button onClick={() => onLearn(q.note!)} className="text-phos underline-offset-2 hover:underline">
                {t(STR.quiz.revise)}
              </button>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
