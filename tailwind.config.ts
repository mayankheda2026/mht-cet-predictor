import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        paper: "#FDFBF7",
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
        hard: "6px 6px 0 0 #0A0A0A",
        hardsm: "3px 3px 0 0 #0A0A0A",
        hardlg: "10px 10px 0 0 #0A0A0A",
        hardacid: "6px 6px 0 0 #D7FF3E",
      },
      borderWidth: { 3: "3px", 5: "5px" },
    },
  },
  plugins: [],
} satisfies Config;
