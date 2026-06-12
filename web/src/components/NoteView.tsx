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

  // Real links are underlined (dotted = note, solid = mission) so they can't
  // be confused with highlighted `code` words, which are not clickable.
  // On the ivory page, links are copper — the editorial accent.
  const A = ({ href, children }: any) => {
    if (typeof href === "string" && href.startsWith("#note:")) {
      return (
        <button
          onClick={() => onNote(href.slice(6))}
          className="font-medium text-copper underline decoration-copper/40 decoration-dotted underline-offset-4 transition-colors hover:decoration-copper"
        >
          {children}
        </button>
      );
    }
    if (typeof href === "string" && href.startsWith("#mission:")) {
      return (
        <button
          onClick={() => onMission(href.slice(9))}
          className="font-semibold text-copper underline decoration-copper/50 underline-offset-4 hover:decoration-copper"
        >
          {children}
        </button>
      );
    }
    return (
      <a href={href} target="_blank" rel="noreferrer" className="text-copper underline underline-offset-4 hover:decoration-copper">
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
            <h1 className="mb-8 border-b border-paperrule pb-4 font-display text-[2.1rem] font-bold leading-tight tracking-tight text-paperink">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-12 font-display text-2xl font-semibold tracking-tight text-paperink">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-8 font-display text-lg font-semibold text-paperink">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5 text-[17px] leading-[1.85] text-paperink/90">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 ml-1 list-none space-y-2 text-[17px] leading-[1.85] text-paperink/90">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 ml-5 list-decimal space-y-2 text-[17px] leading-[1.85] text-paperink/90 marker:font-semibold marker:text-copper">{children}</ol>,
          li: ({ children, ...p }) =>
            "ordered" in p && (p as any).ordered ? (
              <li className="pl-1">{children}</li>
            ) : (
              <li className="relative pl-5 before:absolute before:left-0 before:top-[0.72em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-copper/80">
                {children}
              </li>
            ),
          a: A,
          strong: ({ children }) => <strong className="font-semibold text-paperink">{children}</strong>,
          em: ({ children }) => <em className="italic text-paperink">{children}</em>,
          hr: () => <hr className="my-10 border-paperrule" />,
          // code stays a dark instrument inset, even on the page — like a
          // measurement reading pasted into a notebook
          code: ({ children }) => (
            <code className="rounded bg-abyss px-1.5 py-0.5 font-mono text-[0.85em] text-phos">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-xl bg-abyss px-4 py-3 font-mono text-[0.85em] leading-relaxed text-phos shadow-inner">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-r-lg border-l-[3px] border-copper bg-copper/[0.07] px-5 py-3 text-[16px] italic leading-[1.7] text-paperink/80">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-paperrule">
              <table className="w-full border-collapse text-[15px]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-paperrule bg-paperink/[0.05] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-papermut">{children}</th>
          ),
          td: ({ children }) => <td className="border-b border-paperrule/70 px-4 py-2.5 text-paperink/90">{children}</td>,
        }}
      >
        {body}
      </ReactMarkdown>

      {bl.length > 0 && (
        <div className="mt-14 border-t border-paperrule pt-5">
          <div className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-wider text-papermut">
            {t(STR.library.mentioned)}
          </div>
          <div className="flex flex-wrap gap-2 font-sans">
            {bl.map((s) => (
              <button
                key={s}
                onClick={() => onNote(s)}
                className="rounded-full border border-paperrule px-3 py-1 text-xs text-papermut transition-colors hover:border-copper hover:text-copper"
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
