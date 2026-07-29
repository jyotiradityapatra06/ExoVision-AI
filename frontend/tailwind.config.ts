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
        background: "var(--background)",
        foreground: "var(--foreground)",
        astro: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f293d",
          accent: "#38bdf8",
          purple: "#8b5cf6",
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
