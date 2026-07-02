import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aqua: {
          DEFAULT: "#0891b2",
          dark: "#0e7490",
          light: "#67e8f9",
        },
      },
    },
  },
  plugins: [],
};
export default config;
