import Document, { Html, Head, Main, NextScript } from "next/document"
import { createGetInitialProps } from "@mantine/next"
import { Locale } from "db"

const getInitialProps = createGetInitialProps()

class MyDocument extends Document {
  static getInitialProps = getInitialProps

  render() {
    const { locale } = this.props.__NEXT_DATA__
    const dir = locale === Locale.he ? "rtl" : "ltr"
    return (
      <Html lang={locale} dir={dir} className="h-full bg-white">
        <Head />
        <body className="h-full">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
