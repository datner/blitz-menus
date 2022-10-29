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
      <Html lang={locale} dir={dir} className="bg-white">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Secular+One&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
