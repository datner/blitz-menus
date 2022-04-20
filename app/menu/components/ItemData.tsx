import { ItemI18L } from "db"
import { identity } from "fp-ts/function"

type Props = {
  price: number
  content: ItemI18L
}

export function ItemData(props: Props) {
  const { price, content } = props
  const t = identity
  return (
    <dl className="z-10 flex h-full flex-col truncate p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800">{content.name}</dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {content.description}
      </dd>
      <dt className="sr-only">{t("price")}</dt>
      <div className="flex-grow" />
      <dd>
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          {price} ₪
        </span>
      </dd>
    </dl>
  )
}
