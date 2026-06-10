import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { note, backlinks, preprocess, titleOf } from "../lib/library";
import { useI18n, STR } from "../lib/i18n";

type Nav = { onNote: (slug: string) => void; onMission: (id: string) => void };

/** Renders one knowledge-base note: styled markdown + internal links + backlinks. */
export default function NoteView({ slug, onNote, onMission }: { slug: string } & Nav) {
  const { t, locale } = useI18n();
  const body = preprocess(note(slug, locale) ?? t(STR.library.notFound), locale);
  const bl = backlinks(slug, locale);

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
    <article className="prose-radio mx-auto max-w-[64ch]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-8 font-display text-[2rem] font-bold leading-tight tracking-tight text-paper">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-12 font-display text-xl font-semibold tracking-tight text-slate-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-8 font-display text-base font-semibold text-slate-200">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5 text-[16px] leading-[1.85] text-slate-300/90">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 ml-1 list-none space-y-2 text-[16px] leading-[1.85] text-slate-300/90">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 ml-5 list-decimal space-y-2 text-[16px] leading-[1.85] text-slate-300/90 marker:text-muted">{children}</ol>,
          li: ({ children, ...p }) =>
            "ordered" in p && (p as any).ordered ? (
              <li className="pl-1">{children}</li>
            ) : (
              <li className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-phos/70">
                {children}
              </li>
            ),
          a: A,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="text-slate-200">{children}</em>,
          hr: () => <hr className="my-10 border-edge/60" />,
          code: ({ children }) => (
            <code className="rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[0.85em] text-phos">{children}</code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-lg border-l-2 border-amber/70 bg-amber/[0.06] px-5 py-3 text-[15px] leading-[1.7] text-amber/90">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-edge/70">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-edge bg-ink/40 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-edge/40 px-4 py-2.5 text-slate-300/90">{children}</td>,
        }}
      >
        {body}
      </ReactMarkdown>

      {bl.length > 0 && (
        <div className="mt-14 border-t border-edge/60 pt-5">
          <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t(STR.library.mentioned)}
          </div>
          <div className="flex flex-wrap gap-2 font-sans">
            {bl.map((s) => (
              <button
                key={s}
                onClick={() => onNote(s)}
                className="rounded-full border border-edge/70 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-phos hover:text-phos"
              >
                {titleOf(s, locale)}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
