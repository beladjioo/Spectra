import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NOTES, backlinks, preprocess, titleOf } from "../lib/library";

type Nav = { onNote: (slug: string) => void; onMission: (id: string) => void };

/** Renders one knowledge-base note: styled markdown + internal links + backlinks. */
export default function NoteView({ slug, onNote, onMission }: { slug: string } & Nav) {
  const body = preprocess(NOTES[slug] ?? "# Note introuvable");
  const bl = backlinks(slug);

  const A = ({ href, children }: any) => {
    if (typeof href === "string" && href.startsWith("#note:")) {
      return (
        <button onClick={() => onNote(href.slice(6))} className="text-phos underline-offset-2 hover:underline">
          {children}
        </button>
      );
    }
    if (typeof href === "string" && href.startsWith("#mission:")) {
      return (
        <button
          onClick={() => onMission(href.slice(9))}
          className="font-semibold text-amber underline-offset-2 hover:underline"
        >
          {children}
        </button>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-phos hover:underline">
        {children}
      </a>
    );
  };

  return (
    <article className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 mt-6 font-display text-lg font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 mt-4 font-display font-bold text-slate-200">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-300">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 ml-5 list-disc space-y-1 text-slate-300 marker:text-phos">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-5 list-decimal space-y-1 text-slate-300 marker:text-muted">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: A,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          code: ({ children }) => (
            <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-[0.85em] text-phos">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 rounded-r-lg border-l-2 border-amber bg-amber/5 px-4 py-2 text-sm text-amber">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-edge px-3 py-2 text-left font-semibold text-slate-200">{children}</th>,
          td: ({ children }) => <td className="border-b border-edge/50 px-3 py-2 text-slate-300">{children}</td>,
        }}
      >
        {body}
      </ReactMarkdown>

      {bl.length > 0 && (
        <div className="mt-8 border-t border-edge pt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Mentionné dans</div>
          <div className="flex flex-wrap gap-2">
            {bl.map((s) => (
              <button
                key={s}
                onClick={() => onNote(s)}
                className="rounded-full border border-edge bg-panel px-3 py-1 text-xs text-slate-300 hover:border-phos"
              >
                ← {titleOf(s)}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
