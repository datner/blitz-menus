import { animated, useSpring } from "@react-spring/web"
import { toShekel } from "app/core/helpers/content"
import { ItemI18L } from "db"
import { useTranslations } from "next-intl"
import { memo } from "react"
import { ResizeObserver } from "@juggle/resize-observer"
import { useIsRtl } from "app/core/hooks/useIsRtl"
import { usePrevious } from "app/core/hooks/usePrevious"
import { max, min } from "app/core/helpers/number"
import useMeasure from "react-use-measure"

type Props = {
  price: number
  content: ItemI18L
  amount: number
}

export const ItemData = memo(function ItemData(props: Props) {
  const { price, content, amount } = props
  const [ref, { width }] = useMeasure({ polyfill: ResizeObserver })
  const isRtl = useIsRtl()
  const rtlWidth = isRtl ? width : -width
  const { opacity, x } = useSpring({
    opacity: max(1)(amount),
    x: amount > 0 ? 0 : rtlWidth,
    from: {
      opacity: 0,
      x: rtlWidth,
    },
  })
  const t = useTranslations("menu.Components.ItemData")
  const prevAmount = usePrevious(min(1)(amount))

  return (
    <dl className="z-10 flex h-full flex-col p-3">
      <dt className="sr-only">{t("name")}</dt>
      <dd className="text-sm sm:text-base text-gray-800 overflow-hidden">
        <animated.div style={{ x }} className="flex flex-nowrap">
          <animated.span
            ref={ref}
            style={{ opacity }}
            className="font-semibold ltr:pr-1.5 px-1 rtl:pl-1.5 text-emerald-600"
          >
            x{max(prevAmount)(amount)}
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
        <span className="rounded-full bg-emerald-100 px-2 py-1 ml-1 text-xs font-medium text-emerald-800">
          {toShekel(price)}
        </span>
      </dd>
    </dl>
  )
})
