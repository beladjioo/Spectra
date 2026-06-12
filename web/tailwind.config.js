/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05080d", // the night sky
        abyss: "#020409", // deeper than ink (hero, instruments)
        panel: "#0b121c",
        raise: "#101a27", // raised surfaces (cards on panel)
        edge: "#1b2937",
        phos: "#4af2c8", // phosphor trace
        amber: "#ffb454", // VFO lamp
        signal: "#7dd3fc", // secondary data accent (sky)
        muted: "#697a8c",
        paper: "#e8e3d8", // reading-mode ivory (titles on dark surfaces)
        // "Manuel & laboratoire" reading surface — ink on warm ivory paper
        paperbg: "#efe8d8",
        paperink: "#2a2620",
        papermut: "#6f6655",
        paperrule: "#d9cdb6",
        copper: "#b06a39", // accent links / rules on paper (and dark surfaces)
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        serif: ['"Spectral"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      animation: {
        rise: "rise .6s cubic-bezier(.2,.7,.2,1) both",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        sweep: "sweep 7s linear infinite",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
        sweep: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};
