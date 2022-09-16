import { withBlitz } from "app/blitz-client"
import { Router } from "next/router"
import { useQueryErrorResetBoundary } from "@blitzjs/rpc"
import { AppProps, ErrorBoundary, ErrorComponent, ErrorFallbackProps } from "@blitzjs/next"
import { LoginForm } from "app/auth/components/LoginForm"
import "app/core/styles/index.css"
import { NextIntlProvider } from "next-intl"
import { useLocale } from "app/core/hooks/useLocale"
import { Locale } from "@prisma/client"
import { useIsomorphicLayoutEffect } from "app/core/hooks/useIsomorphicLayoutEffect"
import { AuthenticationError, AuthorizationError } from "blitz"
import { createEmotionCache, MantineProvider } from "@mantine/core"
import NProgress from "nprogress"
import "app/core/styles/nprogress.css"
import { rtlCache } from "app/core/helpers/rtl-cache"

Router.events.on("routeChangeStart", () => NProgress.start())
Router.events.on("routeChangeComplete", () => NProgress.done())
Router.events.on("routeChangeError", () => NProgress.done())

const renuCache = createEmotionCache({ key: "renu" })

export default withBlitz(function App({
  Component,
  pageProps,
}: AppProps<{ messages: IntlMessages }>) {
  const getLayout = Component.getLayout || ((page) => page)
  const { messages, ...rest } = pageProps
  const locale = useLocale()
  const rtl = locale === Locale.he
  const dir = rtl ? "rtl" : "ltr"

  useIsomorphicLayoutEffect(() => {
    document.dir = dir
    document.documentElement.lang = locale
  }, [locale, dir])

  return (
    <NextIntlProvider messages={messages}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        emotionCache={rtl ? rtlCache : renuCache}
        theme={{ dir, primaryColor: "indigo" }}
      >
        <ErrorBoundary
          FallbackComponent={RootErrorFallback}
          onReset={useQueryErrorResetBoundary().reset}
        >
          {getLayout(<Component {...rest} />)}
        </ErrorBoundary>
      </MantineProvider>
    </NextIntlProvider>
  )
})

function RootErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  if (error instanceof AuthenticationError) {
    return <LoginForm onSuccess={resetErrorBoundary} />
  } else if (error instanceof AuthorizationError) {
    return (
      <ErrorComponent
        statusCode={error.statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  } else {
    return (
      <ErrorComponent statusCode={error.statusCode || 400} title={error.message || error.name} />
    )
  }
}
