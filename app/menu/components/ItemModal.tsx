import { Image } from "blitz"
import { Item__Content, OrderMeta } from "../types/item"
import { useLocale } from "app/core/hooks/useLocale"
import { Nullish } from "../types/utils"
import { animated, useSpring } from "@react-spring/web"
import { descriptionFor, price, titleFor } from "app/core/helpers/content"
import { ItemModalForm } from "./ItemModalForm"
import { UIEventHandler, useState } from "react"
import { useEvent } from "app/core/hooks/useEvent"
import { Modal } from "./Modal"

type Props = {
  open?: boolean
  onClose(): void
  onAddToOrder(meta: OrderMeta): void
  item: Item__Content | null
  meta?: Nullish<OrderMeta>
}

export function ItemModal(props: Props) {
  const { open, onClose, onAddToOrder, item, meta } = props
  const [underTheFold, set] = useState(false)
  const locale = useLocale()
  const title = titleFor(locale)
  const desc = descriptionFor(locale)

  const handleScroll = useEvent<UIEventHandler>((event) => {
    set(event.currentTarget.scrollTop > 0)
  })

  const { shadow } = useSpring({
    shadow: underTheFold ? 1 : 0,
  })

  return (
    <Modal open={open} onClose={onClose}>
      <div className="relative rounded-t-xl overflow-hidden flex-shrink-0 basis-56">
        {item && (
          <Image
            src={`${item.image}?fit=crop&crop=entropy&h=${200 * 4}`}
            layout="fill"
            objectFit="cover"
            alt={item.identifier}
          />
        )}
      </div>
      <animated.div
        style={{
          boxShadow: shadow.to(
            (s) =>
              `0 20px 25px -5px rgb(0 0 0 / ${s * 0.1}),
              0 8px 10px -6px rgb(0 0 0 / ${s * 0.1})`
          ),
        }}
        className="mt-3 z-10 px-4 pb-4 sm:mt-5 rtl:text-right"
      >
        <h3 className="text-3xl leading-6 font-medium text-gray-900">{title(item)}</h3>
        <p className="mt-2 text-indigo-600">₪ {price(item)}</p>
        <p className="mt-2 text-sm text-gray-500">{desc(item)}</p>
      </animated.div>
      <div onScroll={handleScroll} className="flex flex-col overflow-auto p-4">
        <ItemModalForm
          price={price(item)}
          meta={meta}
          onSubmit={(meta) => {
            onAddToOrder(meta)
            onClose()
          }}
        />
      </div>
    </Modal>
  )
}

export default ItemModal
