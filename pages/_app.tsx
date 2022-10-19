import { withBlitz } from "app/blitz-client"
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
import { rtlCache } from "app/core/helpers/rtl-cache"
import { RouterTransition } from "app/admin/components/RouterTransition"

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
        theme={{
          dir,
          primaryColor: "teal",
          colors: {
            teal: [
              "#70AD99",
              "#CFE4DD",
              "#BDDFD5",
              "#A0C9BB",
              "#70AD99",
              "#419277",
              "#117755",
              "#0D5940",
              "#093C2B",
              "#041E15",
            ],
          },
        }}
      >
        <RouterTransition />
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
