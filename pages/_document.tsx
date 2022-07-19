import Document, { Html, Head, Main, NextScript } from "next/document"
import { Locale } from "db"

class MyDocument extends Document {
  // static async getInitialProps(ctx: DocumentContext) {
  //   const initialProps = await Document.getInitialProps(ctx)
  //   return { ...initialProps }
  // }

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
