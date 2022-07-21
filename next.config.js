const { withBlitz } = require("@blitzjs/next")
const { withPlaiceholder } = require("@plaiceholder/next")
const { Locale } = require("@prisma/client")

module.exports = withPlaiceholder(
  withBlitz({
    blitz: {},
    reactStrictMode: true,
    swcMinify: true,
    i18n: {
      locales: Object.values(Locale),
      defaultLocale: Locale.en,
    },
    images: {
      loader: "imgix",
      path: "https://renu.imgix.net/",
      domains: ["renu.imgix.net", ""],
    },
  })
)
