const plugin = require("tailwindcss/plugin")

module.exports = {
  content: ["{pages,app}/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    plugin(function ({ addVariant }) {
      addVariant("error", ["&[aria-invalid=true]", "&:invalid"])
    }),
  ],
}
