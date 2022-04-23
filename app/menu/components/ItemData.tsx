import { animated, useSpring } from "@react-spring/web"
import { ItemI18L } from "db"
import { flow } from "fp-ts/function"
import * as O from "fp-ts/Option"
import { useTranslations } from "next-intl"
import { memo, useEffect, useRef } from "react"

type Props = {
  price: number
  content: ItemI18L
  amount: O.Option<number>
}

const reveal = flow(O.isSome, (it) => (it ? 1 : 0))

const orOne = O.getOrElse(() => 1)

export const ItemData = memo(function ItemData(props: Props) {
  const { price, content, amount } = props
  const { opacity } = useSpring({ opacity: reveal(amount) })
  const t = useTranslations("Components.ItemData")
  const amountRef = useRef(1)
  useEffect(() => {
    amountRef.current = orOne(amount)
  }, [amount])

  const orPrev = O.getOrElse(() => amountRef.current)

  return (
    <dl className="z-10 flex h-full flex-col truncate p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800">
        {content.name}{" "}
        <animated.span style={{ opacity }} className="font-semibold text-indigo-600">
          x{orPrev(amount)}
        </animated.span>
      </dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {content.description}
      </dd>
      <dt className="sr-only">{t("price")}</dt>
      <div className="flex-grow" />
      <dd>
        <span className="rounded-full bg-indigo-100 px-2 py-1 ml-1 text-xs font-medium text-indigo-800">
          {price} ₪
        </span>
      </dd>
    </dl>
  )
})
