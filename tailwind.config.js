/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090B0E",
        surface: "#101318",
        "surface-raised": "#161B22",
        "surface-card": "#1A202A",
        border: "#232A36",
        "border-subtle": "#1B212B",
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        accent: {
          green: "#10B981",
          yellow: "#FBBF24",
          blue: "#38BDF8",
          pink: "#F43F5E",
        },
        muted: "#94A3B8",
        subtle: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
