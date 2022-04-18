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
    <dl className="z-10 flex flex-grow flex-col p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-base text-gray-800">{content.name}</dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="truncate text-sm text-gray-500">{content.description}</dd>
      <dt className="sr-only">{t("price")}</dt>
      <dd className="mt-3">
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          {price} ₪
        </span>
      </dd>
    </dl>
  )
}
