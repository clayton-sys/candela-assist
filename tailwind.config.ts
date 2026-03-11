import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#1B2B3A",
        gold: "#E9C03A",
        stone: "#EDE8DE",
        cerulean: "#3A6B8A",
        "midnight-deep": "#0e1e2a",
        "midnight-light": "#243446",
        "gold-dark": "#C9A020",
        "cerulean-dark": "#2A5570",
        error: "#D94F3D",
      },
      fontFamily: {
        fraunces: ["var(--font-fraunces)", "Georgia", "serif"],
        jost: ["var(--font-jost)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "midnight-gradient":
          "linear-gradient(135deg, #0e1e2a 0%, #1B2B3A 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
