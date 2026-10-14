import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: "#1A3A2A",
          700: "#2D6A4F",
          500: "#52B788",
        },
        mint: {
          200: "#B7E4C7",
          100: "#D8F3DC",
        },
        cream: {
          50: "#FAF7F2",
          100: "#F0EBE0",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
