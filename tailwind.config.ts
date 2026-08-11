import type { Config } from "tailwindcss";

// Tailwind CSS v4 uses CSS-first configuration (@theme in globals.css).
// This file is kept for tooling compatibility; content paths are auto-detected.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
