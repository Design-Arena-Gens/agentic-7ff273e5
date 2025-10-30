import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"]
      },
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e7ebfe",
          200: "#d0d6fd",
          300: "#a9b4fb",
          400: "#7b8af7",
          500: "#5362f3",
          600: "#3943e6",
          700: "#2f35c5",
          800: "#2b2fa2",
          900: "#212372",
          950: "#141640"
        }
      }
    }
  },
  plugins: []
};

export default config;
