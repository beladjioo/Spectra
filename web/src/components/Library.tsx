import { useState } from "react";
import NoteView from "./NoteView";
import { SECTIONS, search, titleOf } from "../lib/library";

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
  const [q, setQ] = useState("");
  const results = search(q);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="flex max-h-[78vh] flex-col gap-3 rounded-2xl border border-edge bg-panel p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔎 rechercher…"
          className="w-full rounded-lg border border-edge bg-ink px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-phos"
        />
        <nav className="-mr-1 overflow-y-auto pr-1">
          {q.trim() ? (
            <ul className="flex flex-col gap-0.5">
              {results.length === 0 && <li className="px-2 py-1 text-sm text-muted">aucun résultat</li>}
              {results.map((s) => (
                <NoteLink key={s} s={s} active={s === slug} onClick={() => onSelect(s)} />
              ))}
            </ul>
          ) : (
            SECTIONS.map((sec) => (
              <div key={sec.title} className="mb-3">
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{sec.title}</div>
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

      <section className="rounded-2xl border border-edge/70 bg-panel px-6 py-8 md:px-12 md:py-12">
        <NoteView slug={slug} onNote={onSelect} onMission={onMission} />
      </section>
    </div>
  );
}

function NoteLink({ s, active, onClick }: { s: string; active: boolean; onClick: () => void }) {
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
        {titleOf(s)}
      </button>
    </li>
  );
}
