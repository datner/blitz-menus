import { Locale } from "db"
import { Document, Html, DocumentHead, Main, BlitzScript /* DocumentContext */ } from "blitz"

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
        <DocumentHead />
        <body className="h-full">
          <Main />
          <BlitzScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
