import { useEffect, useRef, useState } from "react";
import NoteView from "./NoteView";
import Icon from "./Icon";
import { SECTIONS, search, titleOf } from "../lib/library";
import { useI18n, STR } from "../lib/i18n";

/** The Obsidian-style knowledge base: sidebar tree + search + note view. */
export default function Library({
  slug,
  onSelect,
  onMission,
}: {
  slug: string;
  onSelect: (s: string) => void;
  onMission: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const results = search(q, locale);
  const artRef = useRef<HTMLElement>(null);

  // bring the (new) note into view on every navigation — crucial on narrow
  // layouts where the article stacks below the sidebar
  useEffect(() => {
    const stacked = window.matchMedia("(max-width: 1023px)").matches;
    if (stacked) artRef.current?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
    else window.scrollTo({ top: 0 });
  }, [slug]);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="flex max-h-[78vh] flex-col gap-3 rounded-2xl border border-edge bg-panel p-3 lg:sticky lg:top-4">
        <div className="relative">
          <Icon name="search" size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t(STR.library.search)}
            className="w-full rounded-lg border border-edge bg-ink py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-phos"
          />
        </div>
        <nav className="-mr-1 overflow-y-auto pr-1">
          {q.trim() ? (
            <ul className="flex flex-col gap-0.5">
              {results.length === 0 && <li className="px-2 py-1 text-sm text-muted">{t(STR.library.noResult)}</li>}
              {results.map((s) => (
                <NoteLink key={s} s={s} active={s === slug} onClick={() => onSelect(s)} />
              ))}
            </ul>
          ) : (
            SECTIONS.map((sec) => (
              <div key={sec.title.fr} className="mb-3">
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {t(sec.title)}
                </div>
                <ul className="flex flex-col gap-0.5">
                  {sec.notes.map((s) => (
                    <NoteLink key={s} s={s} active={s === slug} onClick={() => onSelect(s)} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </nav>
      </aside>

      <section ref={artRef} className="paper paper-bound scroll-mt-3 rounded-2xl px-6 py-8 md:px-14 md:py-14">
        <NoteView slug={slug} onNote={onSelect} onMission={onMission} />
      </section>
    </div>
  );
}

function NoteLink({ s, active, onClick }: { s: string; active: boolean; onClick: () => void }) {
  const { locale } = useI18n();
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full truncate border-l-2 py-1.5 pl-3 pr-2 text-left text-[13px] transition-colors ${
          active
            ? "border-phos font-semibold text-phos"
            : "border-transparent text-slate-400 hover:border-edge hover:text-slate-200"
        }`}
      >
        {titleOf(s, locale)}
      </button>
    </li>
  );
}
