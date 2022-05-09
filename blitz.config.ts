import { Locale } from "db"
import { BlitzConfig, sessionMiddleware, simpleRolesIsAuthorized } from "blitz"
// @ts-ignore
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const config: BlitzConfig = {
  middleware: [
    sessionMiddleware({
      cookiePrefix: "menus-blitz",
      isAuthorized: simpleRolesIsAuthorized,
    }),
  ],
  i18n: {
    locales: Object.values(Locale),
    defaultLocale: Locale.en,
  },
  images: {
    loader: "imgix",
    path: "https://datner.imgix.net/",
    domains: ["datner.imgix.net"],
  },
  /* Uncomment this to customize the webpack config
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    // Important: return the modified config
    return config
  },
 */
}

module.exports = withBundleAnalyzer(config)
