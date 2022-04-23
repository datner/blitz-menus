import { animated, useTransition } from "@react-spring/web"
import { useTranslations } from "next-intl"

type Props = {
  show: boolean
  onClick(): void
  amount: number
  price: number
}

export function ViewOrderButton(props: Props) {
  const { show, onClick, amount, price } = props
  const t = useTranslations("Components.ViewOrderButton")
  const transition = useTransition(show, {
    from: { y: 200, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 200, opacity: 0 },
    reverse: show,
  })

  return transition(
    (styles, show) =>
      show && (
        <animated.button
          style={styles}
          className="flex fixed inset-x-3 bottom-3 justify-center items-center rounded-md border border-transparent shadow-lg shadow-indigo-300 px-2 py-2 bg-indigo-600 text-base text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          onClick={onClick}
        >
          <span className="bg-indigo-100 border text-xs border-indigo-500 text-indigo-800 rounded-full h-6 w-6 flex justify-center items-center">
            {amount}
          </span>
          <span className="inline-block text-left rtl:text-right flex-grow px-3">
            {t("viewOrder")}
          </span>
          <span className="tracking-wider font-thin">₪{price}</span>
        </animated.button>
      )
  )
}
