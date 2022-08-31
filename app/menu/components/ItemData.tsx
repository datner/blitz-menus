import { animated, useSpring } from "@react-spring/web"
import { toShekel } from "app/core/helpers/content"
import { ItemI18L } from "db"
import { flow } from "fp-ts/function"
import * as O from "fp-ts/Option"
import { useTranslations } from "next-intl"
import { memo, useEffect, useRef } from "react"
import { ResizeObserver } from "@juggle/resize-observer"
import useMeasure from "react-use-measure"
import { useIsRtl } from "app/core/hooks/useIsRtl"

type Props = {
  price: number
  content: ItemI18L
  amount: O.Option<number>
}

const orOne = O.getOrElse(() => 1)

export const ItemData = memo(function ItemData(props: Props) {
  const { price, content, amount } = props
  const [ref, { width }] = useMeasure({ polyfill: ResizeObserver })
  const isRtl = useIsRtl()
  const rtlWidth = isRtl ? width : -width
  const { opacity, x } = useSpring({
    opacity: O.isSome(amount) ? 1 : 0,
    x: O.isSome(amount) ? 0 : rtlWidth,
  })
  const t = useTranslations("menu.Components.ItemData")
  const amountRef = useRef(1)
  useEffect(() => {
    amountRef.current = orOne(amount)
  }, [amount])

  const orPrev = O.getOrElse(() => amountRef.current)

  return (
    <dl className="z-10 flex h-full flex-col p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800 overflow-hidden">
        <animated.div style={{ x }} className="flex flex-nowrap">
          <animated.span
            ref={ref}
            style={{ opacity }}
            className="font-semibold ltr:pr-1.5 rtl:pl-1.5 text-indigo-600"
          >
            x{orPrev(amount)}
          </animated.span>
          <animated.span className="block truncate">{content.name}</animated.span>
        </animated.div>
      </dd>
      <dt className="sr-only">{t("description")}</dt>
      <dd className="text-xs sm:text-sm text-gray-500 whitespace-normal line-clamp-2 ">
        {content.description}
      </dd>
      <dt className="sr-only">{t("price")}</dt>
      <div className="flex-grow" />
      <dd>
        <span className="rounded-full bg-indigo-100 px-2 py-1 ml-1 text-xs font-medium text-indigo-800">
          {toShekel(price)}
        </span>
      </dd>
    </dl>
  )
})
