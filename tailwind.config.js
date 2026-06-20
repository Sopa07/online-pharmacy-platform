/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Manrope", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#f6f6fd",
          100: "#e7e9fb",
          200: "#cdd2f4",
          300: "#aeb6ea",
          400: "#8993dc",
          500: "#6a75c7",
          600: "#5259a8",
          700: "#424788",
          800: "#353a6d",
          900: "#2a2e55"
        },
        accent: {
          50: "#f9f1f6",
          100: "#f2d9ea",
          200: "#e4b6d5",
          300: "#d48fbf",
          400: "#bd5ea4",
          500: "#9d3e84",
          600: "#7f2f6a",
          700: "#652556",
          800: "#4f1f44",
          900: "#3f1936"
        }
      },
      boxShadow: {
        soft: "0 8px 30px rgba(14, 80, 98, 0.08)"
      }
    }
  },
  plugins: []
};
