import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F6F7FB",
        primary: "#3A5AFE",
        secondary: "#7A8CFF",
      },
      borderRadius: {
        lg: "0.75rem", // 12px
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;

