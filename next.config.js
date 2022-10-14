// @ts-check
const { withBlitz } = require("@blitzjs/next")
const { withPlaiceholder } = require("@plaiceholder/next")
const { Locale } = require("@prisma/client")

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: Object.values(Locale),
    defaultLocale: Locale.en,
  },
  images: {
    loader: "imgix",
    path: "https://renu.imgix.net/",
    domains: ["renu.imgix.net", "", "images.unsplash.com"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/t/:path",
          destination: "/tiny/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

module.exports = withPlaiceholder(withBlitz(config))
