import Image from "next/image"
import { a, useSpring } from "@react-spring/web"
import { useLocale } from "app/core/hooks/useLocale"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import { ItemData } from "./ItemData"
import { Item__Content } from "../types/item"
import { memo } from "react"
import { useDrag } from "@use-gesture/react"
import { PlusCircleIcon, MinusCircleIcon } from "@heroicons/react/outline"
import { useIsRtl } from "app/core/hooks/useIsRtl"

type Props = {
  item: Item__Content
  amountOption: O.Option<number>
  onClick(): void
  onAdd(): void
  onRemove(): void
}

export const ListItem = memo(function ListItem(props: Props) {
  const { item, amountOption, onClick, onAdd, onRemove } = props
  const locale = useLocale()
  const isRtl = useIsRtl()
  const content = item.content.find((it) => it.locale === locale)
  const isInOrder = O.isSome(amountOption)
  const hideIndicator = isRtl ? 140 : -140
  const [{ x, scale }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
  }))
  const bind = useDrag(
    ({ active, movement: [mx] }) => {
      api.start({
        x: active ? mx : 0,
        scale: active ? 1.02 : 1,
        immediate: (name) => active && name === "x",
      })
      if (!active) {
        const current = isRtl ? -x.get() : x.get()
        if (current >= 70) onAdd()
        if (current <= -70) onRemove()
      }
    },
    { axis: "x", from: [100, 0] }
  )
  const styles = useSpring({
    x: isInOrder ? 0 : hideIndicator,
    opacity: isInOrder ? 1 : 0,
  })
  const price = pipe(
    amountOption,
    O.getOrElse(() => 1),
    (amount) => amount * item.price
  )

  if (!content) return null

  return (
    <a.li {...bind()} onClick={onClick} className="relative touch-pan-y px-2 sm:px-6">
      <a.div className="absolute rtl:bg-gradient-to-r bg-gradient-to-l from-red-300 to-green-200 flex items-center h-36 inset-x-2 sm:inset-x-6 rounded-lg">
        <div className="flex-1 flex text-green-800">
          <PlusCircleIcon className="w-10 h-10 mx-3" />
        </div>
        <div className="flex-1 flex flex-row-reverse text-red-700">
          <MinusCircleIcon className="w-10 h-10 mx-3" />
        </div>
      </a.div>
      <a.div
        style={{ x: x.to({ range: [-70, 70], output: [-70, 70], extrapolate: "clamp" }), scale }}
        className="relative flex flex-1 pointer-events-none h-36 overflow-hidden rounded-lg bg-white shadow"
      >
        <a.div style={styles} className="inset-y-0 absolute ltr:left-0 rtl:right-0">
          <div className="inset-y-0 bg-red-600 bg-gradient-to-t from-indigo-500 to-indigo-700 w-2 absolute shadow-2xl" />
        </a.div>
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={price} amount={amountOption} />
        </div>
        <div className="w-32 relative xs:w-48 m-2 rounded-md overflow-hidden h-32">
          {item.image && (
            <Image
              src={item.image}
              layout="fill"
              sizes="(min-width: 370px) 12rem,
              8rem"
              placeholder={item.blurDataUrl ? "blur" : "empty"}
              blurDataURL={item.blurDataUrl ?? undefined}
              quality={20}
              objectFit="cover"
              alt={item.identifier}
            />
          )}
        </div>
      </a.div>
    </a.li>
  )
})
