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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "renu.imgix.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    loader: "custom",
    loaderFile: "./imgix-loader.js",
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/home",
        permanent: true,
      },
    ]
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
