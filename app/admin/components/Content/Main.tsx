import { ReactNode } from "react"

type Props = { children?: ReactNode }

export function Main(props: Props) {
  const { children } = props
  return (
    <main className="flex-1 relative">
      <section
        aria-labelledby="primary-heading"
        className="min-w-0 flex-1 h-full flex flex-col lg:order-last"
      >
        <h1 id="primary-heading" className="sr-only">
          Photos
        </h1>
        {children}
      </section>
    </main>
  )
}
