// A small, consistent line-icon set (1.6px stroke, currentColor) replacing the
// emoji that used to pepper the UI chrome. Inline SVG: no font, no extra bytes.

export type IconName =
  | "compass"
  | "sliders"
  | "map"
  | "cap"
  | "book"
  | "antenna"
  | "shield"
  | "coffee"
  | "lock"
  | "check"
  | "plug"
  | "wave"
  | "plane"
  | "radio"
  | "burst"
  | "globe"
  | "drone"
  | "sprout"
  | "flask"
  | "pin"
  | "search"
  | "headphones"
  | "stop"
  | "trophy"
  | "spark"
  | "star"
  | "github"
  | "target"
  | "satellite"
  | "wifi";

const P: Record<IconName, JSX.Element> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
    </>
  ),
  map: (
    <>
      <path d="m9 4-6 2.5v13L9 17l6 2.5 6-2.5v-13L15 7 9 4z" />
      <path d="M9 4v13M15 7v12.5" />
    </>
  ),
  cap: (
    <>
      <path d="M12 4 2 9l10 5 10-5-10-5z" />
      <path d="M6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5M22 9v5" />
    </>
  ),
  book: (
    <>
      <path d="M5 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
      <path d="M5 16h12" />
    </>
  ),
  antenna: (
    <>
      <path d="M12 13v8M8 21h8" />
      <path d="M8.5 9.5a5 5 0 0 1 7 0M6 7a8 8 0 0 1 12 0" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  shield: <path d="M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3z" />,
  coffee: (
    <>
      <path d="M4 9h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" />
      <path d="M17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="m5 12 5 5 9-11" />,
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5" />
    </>
  ),
  wave: <path d="M2 12c2 0 2-6 4-6s2 12 4 12 2-12 4-12 2 6 4 6 2-3 2-3" />,
  plane: <path d="M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5V18l7.5-2v3L8 20.5V22l4-1 4 1v-1.5L13.5 19v-3L21 18v-2.5z" />,
  radio: (
    <>
      <rect x="3" y="9" width="18" height="11" rx="2" />
      <path d="M7 9 17 4" />
      <circle cx="8" cy="14.5" r="2" />
      <path d="M14 13h4M14 16h4" />
    </>
  ),
  burst: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </>
  ),
  drone: (
    <>
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <path d="M9 9 5 5M15 9l4-4M9 15l-4 4M15 15l4 4" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c0-3-2-5-5-5 0 3 2 5 5 5zM12 11c0-2.5 2-4.5 5-4.5 0 2.5-2 4.5-5 4.5z" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V3" />
      <path d="M7.5 14h9" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 19h6M10 16h4v3h-4z" />
    </>
  ),
  spark: <path d="M12 3c.6 4.5 1.5 5.4 6 6-4.5.6-5.4 1.5-6 6-.6-4.5-1.5-5.4-6-6 4.5-.6 5.4-1.5 6-6z" />,
  star: <path d="M12 3.5 14.6 9l5.9.6-4.4 4 1.3 5.8L12 16.8 6.6 19.4 7.9 13.6 3.5 9.6 9.4 9z" />,
  github: (
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  satellite: (
    <>
      <path d="M5 11 9 7l3 3-4 4-3-3zM11 9l4-4 3 3-4 4" />
      <path d="m13 13 3 3M16 16a3 3 0 0 1-3 3M19 16a6 6 0 0 1-6 6" />
    </>
  ),
  wifi: <path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0M12 21h.01" />,
};

export default function Icon({
  name,
  size = 18,
  className = "",
  filled = false,
}: {
  name: IconName;
  size?: number;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
