import { Header as ContentHeader } from "app/admin/components/Content/Header"
import { Main as ContentMain } from "app/admin/components/Content/Main"
import { Aside as ContentAside } from "app/admin/components/Content/Aside"
import { ReactNode } from "react"

type ContentAreaProps = {
  main: ReactNode
  aside: ReactNode
}

export function Content(props: ContentAreaProps) {
  const { main, aside } = props
  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      <ContentHeader />
      {/* Main content */}
      <div className="flex-1 flex items-stretch overflow-hidden">
        <ContentMain>{main}</ContentMain>
        {aside && <ContentAside>{aside}</ContentAside>}
      </div>
    </div>
  )
}
