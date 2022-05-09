import { Image } from "blitz"
import { animated, useSpring } from "@react-spring/web"
import { useLocale } from "app/core/hooks/useLocale"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import { Locale } from "db"
import { ItemData } from "./ItemData"
import { Item__Content } from "../types/item"
import { memo } from "react"

type Props = {
  item: Item__Content
  amountOption: O.Option<number>
  onClick(): void
}

export const ListItem = memo(function ListItem(props: Props) {
  const { item, amountOption, onClick } = props
  const locale = useLocale()
  const content = item.content.find((it) => it.locale === locale)
  const isInOrder = O.isSome(amountOption)
  const hideIndicator = locale === Locale.he ? 140 : -140
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
    <li onClick={onClick} className="relative px-2 sm:px-6">
      <div className="relative flex flex-1 h-36 overflow-hidden rounded-lg bg-white shadow">
        <animated.div style={styles} className="inset-y-0 absolute ltr:left-0 rtl:right-0">
          <div className="inset-y-0 bg-gradient-to-t from-indigo-500 to-indigo-700 w-2 absolute shadow-2xl" />
        </animated.div>
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={price} amount={amountOption} />
        </div>
        <div className="flex relative justify-center items-center">
          <div className="relative flex-shrink-0 w-32 xs:w-48 h-36">
            <Image src={item.image} layout="fill" objectFit="cover" alt={item.identifier} />
          </div>
        </div>
      </div>
    </li>
  )
})
