import Image from "next/image"
import { a, useSpring } from "@react-spring/web"
import { useLocale } from "app/core/hooks/useLocale"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import { gt } from "fp-ts/Ord"
import { Ord as ordNumber } from "fp-ts/number"
import { ItemData } from "./ItemData"
import { Item__Content } from "../types/item"
import { memo } from "react"
import { useDrag } from "@use-gesture/react"
import { PlusCircleIcon, MinusCircleIcon, XCircleIcon } from "@heroicons/react/outline"
import { useIsRtl } from "app/core/hooks/useIsRtl"
import { clamp } from "app/core/helpers/number"

type Props = {
  item: Item__Content
  amountOption: O.Option<number>
  onClick(): void
  onAdd(): void
  onRemove(): void
}

const PlusCircle = a(PlusCircleIcon)
const MinusCircle = a(MinusCircleIcon)
const XCircle = a(XCircleIcon)

const ordNumberO = pipe(ordNumber, O.getOrd, gt)

export const ListItem = memo(function ListItem(props: Props) {
  const { item, amountOption, onClick, onAdd, onRemove } = props
  const locale = useLocale()
  const isRtl = useIsRtl()
  const content = item.content.find((it) => it.locale === locale)
  const isInOrder = O.isSome(amountOption)
  const hideIndicator = isRtl ? 40 : -40
  const [{ x, scale }, api] = useSpring(() => ({
    x: 0,
    scale: 1,
  }))
  const bind = useDrag(
    ({ down: active, offset: [ox] }) => {
      const getX = clamp(-70, 70)
      api.start({
        x: active ? getX(ox) : 0,
        scale: active ? 1.02 : 1,
        immediate: (name) => active && name === "x",
      })
      if (!active) {
        const current = isRtl ? -x.get() : x.get()
        if (current >= 70) onAdd()
        if (current <= -70) onRemove()
      }
    },
    { axis: "x", from: () => [x.get(), 0] }
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

  const output = [isInOrder ? 1 : 0.1, 0.1, 0.1, 1]
  const opacity = x.to({
    range: [-70, -60, 60, 70],
    output: isRtl ? output.reverse() : output,
  })

  return (
    <a.li {...bind()} onClick={onClick} className="relative touch-pan-y px-2 sm:px-6">
      <a.div
        className={`absolute rtl:bg-gradient-to-r bg-gradient-to-l ${
          isInOrder ? "from-red-300" : "from-gray-300"
        } to-green-200 flex items-center h-36 inset-x-2 sm:inset-x-6 transition-all rounded-lg`}
      >
        <div className="flex-1 flex text-green-800">
          <PlusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
        </div>
        <div
          className={`flex-1 flex flex-row-reverse ${isInOrder ? "text-red-700" : "text-gray-700"}`}
        >
          {ordNumberO(amountOption, O.some(1)) ? (
            <MinusCircle style={{ opacity }} className="w-10 h-10 mx-3" />
          ) : (
            <XCircle style={{ opacity }} className="w-10 h-10 mx-3" />
          )}
        </div>
      </a.div>
      <a.div
        style={{ x, scale }}
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
