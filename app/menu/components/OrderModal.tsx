import { Item__Content } from "../types/item"
import { animated, useChain, useSpring, useSpringRef, useTransition } from "@react-spring/web"
import { XIcon } from "@heroicons/react/solid"
import sendOrderMutation from "app/menu/mutations/sendOrder"
import { useMutation } from "blitz"
import { useLocale } from "app/core/hooks/useLocale"
import { price, titleFor } from "app/core/helpers/content"
import { AmountButtons, AmountButtonsProps } from "./AmountButtons"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

export interface FullOrderItem {
  amount: number
  item: Item__Content
}

type Props = {
  open?: boolean
  items: FullOrderItem[]
  amount: number
  price: number
  change(item: Item__Content, amount: number): void
  onClose(): void
}

export function OrderModal(props: Props) {
  const { onClose, open, items, change, price: overallPrice, amount } = props
  const locale = useLocale()
  const t = useTranslations("Components.OrderModal")
  const [sendOrder] = useMutation(sendOrderMutation, {})

  const title = titleFor(locale)

  const transition = useTransition(open, {
    from: { y: 400, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 400, opacity: 0 },
    reverse: open,
  })

  useEffect(() => {
    if (open && items.length === 0) onClose()
  }, [open, items, onClose])

  return transition(
    (styles, show) =>
      show && (
        <div className="fixed z-50 inset-0">
          <animated.div
            style={{ opacity: styles.opacity }}
            className="absolute inset-0 max-h-screen bg-gray-500/75"
          />
          <animated.div style={styles} className="absolute flex flex-col inset-0">
            <div onClick={onClose} className="h-12 flex-grow flex-shrink-0" />
            <div className="bg-white relative p-4 flex-shrink-0 basis-72 rounded-t-xl">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 h-10 w-10 p-1.5 text-gray-700 rounded-full bg-gray-400/50"
              >
                <XIcon />
              </button>
              <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
              <hr className="w-1/2 mt-1 mb-2" />
              <ul className="divide-y divide-indigo-400">
                {items.map(({ item, amount }) => (
                  <li className="h-10 py-8 flex items-center" key={item.id}>
                    <div className="flex-grow">
                      <div>
                        <p className="text-sm whitespace-pre-line">
                          <span>{title(item)}</span>
                          <span className="rounded-full mx-1 text-xs font-medium text-indigo-800">
                            {price(item) * amount}₪
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="basis-28">
                      <Thing
                        minimum={0}
                        amount={amount}
                        onChange={(newAmount) => change(item, newAmount)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="h-8" />
              <button className="inline-flex fixed inset-x-3 bottom-3 justify-center items-center rounded-md border border-transparent shadow-lg shadow-indigo-300 px-2 py-2 bg-indigo-600 text-base text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                <span className="bg-indigo-100 border text-xs border-indigo-500 text-indigo-800 rounded-full h-6 w-6 flex justify-center items-center">
                  {amount}
                </span>
                <span className="inline-block flex-grow px-3 text-left rtl:text-right">
                  {t("order")}
                </span>
                <span className="tracking-wider font-thin">₪{overallPrice}</span>
              </button>
            </div>
          </animated.div>
        </div>
      )
  )
}

export default OrderModal

function Thing(props: AmountButtonsProps) {
  const [show, setShow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = containerRef.current?.offsetWidth ?? 0
  const firstApi = useSpringRef()
  const { width } = useSpring({
    ref: firstApi,
    width: show ? containerWidth : 40,
  })

  const secondApi = useSpringRef()
  const { transform, opacity, pointerEvents } = useSpring({
    ref: secondApi,
    opacity: show ? 1 : 0,
    transform: "",
    pointerEvents: show ? ("auto" as const) : ("none" as const),
    config: { mass: 5, tension: 500, friction: 80 },
  })

  useChain([firstApi, secondApi], [0, 0.3])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      onClick={() => setShow(true)}
    >
      <animated.div
        className="absolute inset-0 flex flex-row-reverse items-center"
        style={{ opacity: opacity.to((o) => 1 - o), transform }}
      >
        <animated.div
          style={{ width }}
          className="h-10 rounded-md text-sm sm:text-base text-indigo-500 border-gray-300 flex items-center justify-center bg-indigo-50 border"
        >
          {props.amount}
        </animated.div>
      </animated.div>
      <animated.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity,
          transform,
          pointerEvents,
        }}
      >
        <AmountButtons {...props} />
      </animated.div>
    </div>
  )
}
