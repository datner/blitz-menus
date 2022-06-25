import {
  AppProps,
  ErrorBoundary,
  ErrorComponent,
  AuthenticationError,
  AuthorizationError,
  ErrorFallbackProps,
  useQueryErrorResetBoundary,
  Router,
} from "blitz"
import { LoginForm } from "app/auth/components/LoginForm"
import "app/core/styles/index.css"
import { NextIntlProvider } from "next-intl"
import { useLocale } from "app/core/hooks/useLocale"
import { Locale } from "db"
import NProgress from "nprogress"
import "app/core/styles/nprogress.css"
import { useIsomorphicLayoutEffect } from "app/core/hooks/useIsomorphicLayoutEffect"

Router.events.on("routeChangeStart", () => NProgress.start())
Router.events.on("routeChangeComplete", () => NProgress.done())
Router.events.on("routeChangeError", () => NProgress.done())

export default function App({ Component, pageProps }: AppProps) {
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
}

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
