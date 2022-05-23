import { useScroll } from "@use-gesture/react"
import { Image } from "blitz"
import { Item__Content, OrderMeta } from "../types/item"
import { useLocale } from "app/core/hooks/useLocale"
import { clampBetween } from "app/core/helpers/number"
import { Nullish } from "../types/utils"
import { a, useSpring } from "@react-spring/web"
import { descriptionFor, price, priceShekel, titleFor } from "app/core/helpers/content"
import { ItemModalForm } from "./ItemModalForm"
import { useState } from "react"
import { Modal } from "./Modal"

type Props = {
  open?: boolean
  onClose(): void
  onAddToOrder(meta: OrderMeta): void
  item: Item__Content | null
  meta?: Nullish<OrderMeta>
}

const ImageBasis = {
  Max: 224,
  Min: 112,
} as const

const THREE_QUATERS_PROGRESS = ImageBasis.Min * 1.5

const clampImgHeight = clampBetween(ImageBasis.Min, ImageBasis.Max)
const clampBinary = clampBetween(0, 1)

export function ItemModal(props: Props) {
  const { open, onClose, onAddToOrder, item, meta } = props
  const locale = useLocale()
  const title = titleFor(locale)
  const desc = descriptionFor(locale)
  const [containerEl, set] = useState<HTMLDivElement | null>(null)
  const { shadow, imgHeight, imgOpacity, rounded, titleOpacity, y } = useSpring({
    shadow: 0,
    imgHeight: ImageBasis.Max as number,
    imgOpacity: 1,
    titleOpacity: 1,
    rounded: 12,
    y: -58,
  })

  const bind = useScroll(({ xy: [_, yd] }) => {
    const halfwayProgress = clampBinary(yd / ImageBasis.Min)
    const lastQuaterProgress = clampBinary(yd / THREE_QUATERS_PROGRESS)
    imgHeight.set(clampImgHeight(ImageBasis.Max - yd + 20))
    imgOpacity.set(1 - (yd - ImageBasis.Min) / ImageBasis.Min)
    if (rounded.get() !== 0) {
      rounded.set(12 - halfwayProgress * 12)
    }

    if (lastQuaterProgress === 1) {
      y.start(0)
      titleOpacity.start(0)
      shadow.start(1)
    }

    if (lastQuaterProgress === 0) {
      y.stop()
      titleOpacity.stop()
      shadow.stop()
      y.start(-58).then(() => rounded.start(12))
      titleOpacity.start(1)
      shadow.start(0)
    }
  })

  return (
    <Modal open={open} onClose={onClose}>
      <a.div
        ref={(el) => set(el)}
        {...bind()}
        style={{ borderTopLeftRadius: rounded, borderTopRightRadius: rounded }}
        className="relative flex flex-col overflow-auto bg-white pb-12"
      >
        <div className="flex flex-col-reverse shrink-0 basis-56">
          <a.div
            style={{ height: imgHeight, opacity: imgOpacity }}
            className="relative w-full self-end grow-0 shrink-0"
          >
            {item && (
              <Image
                src={item.image || "loremflickr.com/640/480/food"}
                layout="fill"
                objectFit="cover"
                alt={item.identifier}
              />
            )}
          </a.div>
        </div>
        <div className="mt-3 z-10 px-4 pb-4 sm:mt-5 rtl:text-right">
          <a.h3
            style={{ opacity: titleOpacity }}
            className="text-3xl leading-6 font-medium text-gray-900"
          >
            {title(item)}
          </a.h3>
          <p className="mt-2 text-indigo-600">₪ {priceShekel(item)}</p>
          <p className="mt-2 text-sm text-gray-500">{desc(item)}</p>
        </div>
        <div className="flex flex-col p-4">
          <ItemModalForm
            containerEl={containerEl}
            price={price(item)}
            meta={meta}
            onSubmit={(meta) => {
              onAddToOrder(meta)
              onClose()
            }}
          />
        </div>
      </a.div>
      <a.div
        className="h-14 w-full z-10 absolute flex justify-center items-center bg-white"
        style={{
          y,
          boxShadow: shadow.to(
            (s) =>
              `0 20px 25px -5px rgb(0 0 0 / ${s * 0.1}),
              0 8px 10px -6px rgb(0 0 0 / ${s * 0.1})`
          ),
        }}
      >
        <a.h3 className="text-2xl leading-6 font-medium text-gray-900">{title(item)}</a.h3>
      </a.div>
    </Modal>
  )
}

export default ItemModal
