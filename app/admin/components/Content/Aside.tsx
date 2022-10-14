import { ReactNode } from "react"

type Props = { children?: ReactNode }

export function Aside({ children }: Props) {
  return (
    <aside className="hidden h-full relative w-96 bg-white ltr:border-l rtl:border-r border-gray-200 overflow-y-auto lg:block">
      {children}
    </aside>
  )
}
