/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1a17",
        sand: "#f7f1e8",
        clay: "#e8d6c5",
        brand: "#1a7f72",
        "brand-strong": "#12665c",
        sun: "#f2c35a",
        rose: "#d86b5f",
        mist: "#f4f0ea",
        slate: "#6d645c",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        body: ['"Manrope"', "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 40px rgba(31, 26, 23, 0.12)",
      },
    },
  },
  plugins: [],
};
