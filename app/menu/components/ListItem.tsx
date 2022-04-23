import { Image } from "blitz"
import { animated, Spring, useSpring } from "@react-spring/web"
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
  const hideIndicator = locale === Locale.he ? 8 : -8
  const styles = useSpring({ x: isInOrder ? 0 : hideIndicator })
  const price = pipe(
    amountOption,
    O.getOrElse(() => 1),
    (amount) => amount * item.price
  )

  if (!content) return null

  return (
    <li onClick={onClick} className="relative px-2 sm:px-6">
      <div className="relative flex flex-1 h-28 overflow-hidden rounded-lg bg-white shadow">
        <animated.div
          style={styles}
          className="inset-y-0 bg-indigo-500 ltr:left-0 rtl:right-0 w-2 absolute"
        />
        <div className="grow w-40 overflow-hidden">
          <ItemData content={content} price={price} amount={amountOption} />
        </div>
        <div className="flex relative justify-center items-center">
          <div className="relative flex-shrink-0 w-32 ltr:mr-4 rtl:ml-4 h-20 sm:w-48 sm:h-24 sm:mr-2">
            <Image
              src={`${item.image}?fit=crop&crop=entropy&h=${128 * 4}`}
              layout="fill"
              objectFit="cover"
              className="rounded h-full"
              alt={item.identifier}
            />
          </div>
        </div>
      </div>
    </li>
  )
})
