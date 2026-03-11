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
        midnight: "#1B1F2E",
        gold: "#F5A623",
        stone: "#E8E0D5",
        cerulean: "#2E86AB",
        "midnight-light": "#252A3D",
        "gold-dark": "#D4891A",
        "cerulean-dark": "#236E8A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
