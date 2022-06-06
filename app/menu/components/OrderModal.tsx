import { FullOrderItem, Item__Content, OrderMeta } from "../types/item"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { OrderModalItem } from "./OrderModalItem"
import { Modal } from "./Modal"
import { useEvent } from "app/core/hooks/useEvent"
import { toShekel } from "app/core/helpers/content"

type Props = {
  open?: boolean
  items: FullOrderItem[]
  amount: number
  price: number
  change(item: Item__Content, meta: OrderMeta): void
  onClose(): void
  onOrder(): void
}

export function OrderModal(props: Props) {
  const { onClose, onOrder, open, items, change, price: overallPrice, amount } = props
  const t = useTranslations("menu.Components.OrderModal")
  const handleChange = useEvent(({ item, ...meta }: FullOrderItem) => change(item, meta))

  useEffect(() => {
    if (open && items.length === 0) onClose()
  }, [open, items, onClose])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-3 pb-16 bg-white rounded-t-xl overflow-auto">
        <h3 className="text-2xl rtl:mt-9">{t("yourOrder")}</h3>
        <hr className="w-1/2 mt-1 mb-2" />
        <div>
          <ul className="divide-y divide-indigo-400">
            {items.map(({ item, amount, comment }) => (
              <OrderModalItem
                key={item.id}
                orderItem={{ item, amount, comment }}
                onChange={handleChange}
              />
            ))}
          </ul>
          <div className="h-8" />
          <button
            onClick={onOrder}
            className="inline-flex w-full justify-center items-center rounded-md border border-transparent shadow-lg shadow-indigo-300 px-4 py-2 bg-indigo-600 text-base text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
          >
            <span className="bg-indigo-100 border text-xs border-indigo-500 text-indigo-800 rounded-full h-6 w-6 flex justify-center items-center">
              {amount}
            </span>
            <span className="inline-block flex-grow px-3 text-left rtl:text-right">
              {t("order")}
            </span>
            <span className="tracking-wider font-thin">{toShekel(overallPrice)}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default OrderModal
