import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FDFBF7",
        cloud: "#F3EFE6",    // quiet panel fill (the "luxury 30%" — lets things recede)
        line: "#E8E2D5",     // hairline divider on paper
        acid: "#D7FF3E",     // signature lime
        flame: "#FF5C38",    // orange-red
        sky: "#3D7BFF",      // electric blue
        grape: "#9B5CFF",
        mint: "#00D68F",
        gold: "#FFC73E",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        // Hard offset shadows — the brutalist signature. Default is now lighter
        // (4px) so surfaces breathe; reserve hard/hardlg for primary moments.
        hard: "4px 4px 0 0 #0A0A0A",
        hardsm: "2px 2px 0 0 #0A0A0A",
        hardlg: "8px 8px 0 0 #0A0A0A",
        hardxl: "12px 12px 0 0 #0A0A0A",
        hardacid: "5px 5px 0 0 #D7FF3E",
        // The "modern luxury" 30%: a whisper of real depth for hover lifts.
        soft: "0 1px 2px rgba(10,10,10,.04), 0 8px 24px -8px rgba(10,10,10,.14)",
        glow: "0 0 0 4px rgba(215,255,62,.35), 0 0 22px 2px rgba(215,255,62,.55)",
      },
      borderWidth: { 3: "3px", 5: "5px" },
      transitionTimingFunction: {
        // Snappy, confident easing — the "expensive" feel.
        brut: "cubic-bezier(.2,.9,.25,1)",
        out: "cubic-bezier(.16,1,.3,1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%,100%": { boxShadow: "0 0 0 3px rgba(215,255,62,.3), 0 0 16px 1px rgba(215,255,62,.45)" },
          "50%": { boxShadow: "0 0 0 5px rgba(215,255,62,.45), 0 0 26px 3px rgba(215,255,62,.7)" },
        },
      },
      animation: {
        riseIn: "riseIn .5s cubic-bezier(.16,1,.3,1) both",
        popIn: "popIn .35s cubic-bezier(.16,1,.3,1) both",
        glowPulse: "glowPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
