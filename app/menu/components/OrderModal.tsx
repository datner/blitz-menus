import { FullOrderItem, Item__Content, OrderMeta } from "../types/item"
import { useTranslations } from "next-intl"
import { OrderModalItem } from "./OrderModalItem"
import { Modal } from "./Modal"
import { useEvent } from "app/core/hooks/useEvent"
import { titleFor, toShekel } from "app/core/helpers/content"
import { useMutation } from "@blitzjs/rpc"
import sendOrder from "../mutations/sendOrder"
import { useLocale } from "app/core/hooks/useLocale"
import { useZodParams } from "app/core/hooks/useParams"
import { Query } from "app/menu/validations/page"
import useMeasure from "react-use-measure"
import { usePrevious } from "app/core/hooks/usePrevious"
import { useSpring, a } from "@react-spring/web"
import { Locale } from "@prisma/client"

type Props = {
  open?: boolean
  items: FullOrderItem[]
  amount: number
  price: number
  change(item: Item__Content, meta: OrderMeta): void
  onClose(): void
}

const title = titleFor(Locale.he)
export function OrderModal(props: Props) {
  const { onClose, open, items, change, price: overallPrice, amount } = props
  const t = useTranslations("menu.Components.OrderModal")
  const locale = useLocale()
  const { restaurant } = useZodParams(Query)
  const [ref, { height }] = useMeasure()
  const isNoHeight = usePrevious(height) === 0
  const { h } = useSpring({ h: height, immediate: isNoHeight })
  const [sendOrderMutation, { isIdle }] = useMutation(sendOrder, {
    onSuccess({ clearingUrl }) {
      if (clearingUrl) {
        window.location.assign(clearingUrl)
      }
    },
  })

  const handleChange = useEvent(({ item, ...meta }: FullOrderItem) => {
    change(item, meta)
    if (meta.amount === 0 && amount === 1) {
      onClose()
    }
  })

  const handleOrder = () => {
    sendOrderMutation({
      locale,
      venueIdentifier: restaurant,
      orderItems: items.map((it) => ({
        comment: it.comment,
        amount: it.amount,
        price: it.item.price,
        item: it.item.id,
        name: title(it.item),
      })),
    })
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-3 pb-16 bg-white rounded-t-xl overflow-auto">
        <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
        <hr className="w-1/2 mt-1 mb-2" />
        <div>
          <a.div style={{ height: h }}>
            <ul ref={ref} className="divide-y divide-indigo-400">
              {items.map(({ item, amount, comment }) => (
                <OrderModalItem
                  key={item.id}
                  orderItem={{ item, amount, comment }}
                  onChange={handleChange}
                />
              ))}
            </ul>
          </a.div>
          <div className="h-8" />
          <button
            onClick={handleOrder}
            disabled={!isIdle}
            className="inline-flex w-full justify-center items-center rounded-md border border-transparent shadow-lg shadow-indigo-300 px-4 py-2 bg-indigo-600 text-base text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            <span className="bg-indigo-100 border text-xs border-indigo-500 text-indigo-800 rounded-full h-6 w-6 flex justify-center items-center">
              {amount}
            </span>
            <span className="inline-block flex-grow px-3 text-left rtl:text-right">
              {isIdle ? t("order") : t("loading")}
            </span>
            <span className="tracking-wider font-thin">{toShekel(overallPrice)}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderModal
