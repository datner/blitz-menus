// tailwind.config.js
module.exports = {
  content: ["{pages,app}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/line-clamp")],
}
