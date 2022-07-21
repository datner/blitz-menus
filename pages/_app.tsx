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
import NProgress from "nprogress"
import "app/core/styles/nprogress.css"

Router.events.on("routeChangeStart", () => NProgress.start())
Router.events.on("routeChangeComplete", () => NProgress.done())
Router.events.on("routeChangeError", () => NProgress.done())

export default withBlitz(function App({ Component, pageProps }: AppProps) {
  const getLayout = Component.getLayout || ((page) => page)
  const locale = useLocale()

  useIsomorphicLayoutEffect(() => {
    document.dir = locale === Locale.en ? "ltr" : "rtl"
    document.documentElement.lang = locale
  }, [locale])

  return (
    <NextIntlProvider messages={pageProps.messages}>
      <ErrorBoundary
        FallbackComponent={RootErrorFallback}
        onReset={useQueryErrorResetBoundary().reset}
      >
        {getLayout(<Component {...pageProps} />)}
      </ErrorBoundary>
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
