import { ChevronUpIcon } from "@heroicons/react/solid"
import { usePrev } from "@react-spring/shared"
import { useChain, useSpring, useSpringRef, a, config } from "@react-spring/web"
import { price, titleFor, toShekel } from "app/core/helpers/content"
import { useLocale } from "app/core/hooks/useLocale"
import { useState } from "react"
import useMeasure from "react-use-measure"
import { FullOrderItem } from "../types/item"
import { ResizeObserver } from "@juggle/resize-observer"
import { AmountButtons, AmountButtonsProps } from "./AmountButtons"
import { useTranslations } from "next-intl"
import LabeledTextAreaNoForm from "app/core/components/LabeledTextAreaNoForm"

type Props = {
  readonly orderItem: FullOrderItem
  onChange(order: FullOrderItem): void
}

export function OrderModalItem(props: Props) {
  const { orderItem, onChange } = props
  const t = useTranslations("menu.Components.OrderModalItem")
  const { item, amount, comment } = orderItem
  const [isOpen, setOpen] = useState(false)
  const previous = usePrev(isOpen)
  const locale = useLocale()
  const [ref, { height: contentHeight }] = useMeasure({ polyfill: ResizeObserver })
  const { height, opacity } = useSpring({
    from: { height: 0, opacity: 0 },
    to: { height: isOpen ? contentHeight : 0, opacity: isOpen ? 1 : 0 },
    config: config.stiff,
  })

  const title = titleFor(locale)
  return (
    <li className="pt-8 pb-6">
      <div className="h-14 flex items-center">
        <div className="flex-grow bg-white mr-px" onClick={() => setOpen((o) => !o)}>
          <div className="flex items-center">
            <a.span className="m-1">
              <ChevronUpIcon className="h-5 text-indigo-600" />
            </a.span>
            <p className="text-sm whitespace-pre-line">
              <span>{title(item)}</span>
              <span className="rounded-full mx-1 text-xs font-medium text-indigo-800">
                {toShekel(price(item) * amount)}
              </span>
            </p>
          </div>
        </div>
        <div className="basis-32">
          <Thing
            minimum={0}
            amount={amount}
            onChange={(newAmount) => onChange({ item, amount: newAmount, comment })}
          />
        </div>
      </div>
      <a.div
        className="overflow-hidden"
        style={{ opacity, height: isOpen && previous === isOpen ? "auto" : height }}
      >
        <a.div className="pb-2 mx-px" style={{ opacity }} ref={ref}>
          <LabeledTextAreaNoForm
            name="comment"
            value={comment}
            onChange={(event) => onChange({ item, amount, comment: event.target.value })}
            label={t("comment")}
          />
        </a.div>
      </a.div>
    </li>
  )
}

function Thing(props: AmountButtonsProps) {
  const [show, setShow] = useState(false)
  const [ref, { width: containerWidth }] = useMeasure({ polyfill: ResizeObserver })
  const firstApi = useSpringRef()
  const { width } = useSpring({
    ref: firstApi,
    width: show ? containerWidth : 40,
  })

  const secondApi = useSpringRef()
  const { opacity, pointerEvents } = useSpring({
    ref: secondApi,
    opacity: show ? 1 : 0,
    pointerEvents: show ? ("auto" as const) : ("none" as const),
    config: { mass: 5, tension: 500, friction: 80 },
  })

  useChain([firstApi, secondApi], [0, 0.3])

  return (
    <div
      ref={ref}
      className="relative flex items-center justify-center"
      onClick={() => setShow(true)}
    >
      <a.div
        className="absolute inset-0 flex flex-row-reverse items-center"
        style={{ opacity: opacity.to((o) => 1 - o) }}
      >
        <a.div
          style={{ width }}
          className="h-10 rounded-md text-sm sm:text-base text-indigo-500 border-gray-300 flex items-center justify-center bg-indigo-50 border"
        >
          {props.amount}
        </a.div>
      </a.div>
      <a.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity, pointerEvents }}
      >
        <AmountButtons {...props} />
      </a.div>
    </div>
  )
}
