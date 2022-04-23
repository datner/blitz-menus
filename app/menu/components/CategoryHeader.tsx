import { titleFor } from "app/core/helpers/content"
import { useLocale } from "app/core/hooks/useLocale"
import { forwardRef, memo } from "react"
import { Category__Content } from "../types/menu"

type Props = {
  category: Category__Content
}

export const CategoryHeader = memo(
  forwardRef<HTMLDivElement, Props>(({ category }, ref) => {
    const title = titleFor(useLocale())

    return (
      <div
        id={category.identifier}
        ref={ref}
        className="mb-2 border-b pl-5 border-gray-200 px-6 py-1 font-medium text-gray-800"
      >
        <h3 className="text-lg sm:text-3xl">{title(category)}</h3>
      </div>
    )
  })
)
