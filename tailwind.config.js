const plugin = require("tailwindcss/plugin")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["{pages,app}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "370px",
      },
      colors: {
        emerald: {
          50: "#70AD99",
          100: "#CFE4DD",
          200: "#BDDFD5",
          300: "#A0C9BB",
          400: "#70AD99",
          500: "#419277",
          600: "#117755",
          700: "#0D5940",
          800: "#093C2B",
          900: "#041E15",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    plugin(function ({ addVariant }) {
      addVariant("error", ["&[aria-invalid=true]", "&:invalid"])
    }),
  ],
}
