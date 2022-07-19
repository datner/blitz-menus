import { gSP } from "app/blitz-server"
import { useMutation } from "@blitzjs/rpc"
import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType } from "blitz"
import type { Item__Content, OrderMeta } from "app/menu/types/item"

import clsx from "clsx"
import db, { Locale } from "db"
import * as Op from "fp-ts/Option"
import { lazy, Suspense, useState } from "react"
import { z } from "zod"
import { useLocale } from "app/core/hooks/useLocale"
import { titleFor } from "app/core/helpers/content"
import { max } from "app/core/helpers/number"
import { ListItem } from "app/menu/components/ListItem"
import { CategoryHeader } from "app/menu/components/CategoryHeader"
import { useOrder } from "app/menu/hooks/useOrder"
import { useNavBar } from "app/menu/hooks/useNavBar"
import sendOrder from "app/menu/mutations/sendOrder"
import { useZodParams } from "app/core/hooks/useParams"
import { decrement, flow, increment, pipe } from "fp-ts/function"

const LazyViewOrderButton = lazy(() => import("app/menu/components/ViewOrderButton"))
const LazyItemModal = lazy(() => import("app/menu/components/ItemModal"))
const LazyOrderModal = lazy(() => import("app/menu/components/OrderModal"))

export default function Menu(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { restaurant } = props
  const { categories } = restaurant
  const navbar = useNavBar({ initialActive: categories?.[0]?.identifier })
  const { table } = useZodParams(Query)
  const locale = useLocale()
  const order = useOrder()
  const [item, setItem] = useState<Item__Content | null>(null)
  const [open, setOpen] = useState(false)
  const [reviewOrder, setReviewOrder] = useState(false)
  const [sendOrderMutation] = useMutation(sendOrder, {
    onSuccess({ clearingUrl }) {
      if (clearingUrl) {
        window.location.replace(clearingUrl)
      }
    },
  })

  const handleShowOrderModal = (item: Item__Content) => {
    setItem(item)
    setOpen(true)
  }

  const handleChangeOrder = (meta: OrderMeta) => {
    if (!item) return
    order.change(item, meta)
  }

  const handleOrder = () => {
    sendOrderMutation({
      locale,
      venueId: restaurant.id,
      orderItems: order.items.map((it) => ({
        comment: it.comment,
        amount: it.amount,
        price: it.item.price,
        item: it.item.id,
      })),
    })
  }

  if (!categories) return <>:()</>

  const getTitle = titleFor(locale)
  const getMeta = flow(
    order.get,
    Op.fromNullable,
    Op.getOrElse(() => ({ amount: 0, comment: "" }))
  )

  return (
    <div
      ref={navbar.containerRef}
      onScroll={navbar.onScroll}
      className={clsx(
        "relative h-full bg-gray-50 scroll-smooth",
        open || reviewOrder ? "overflow-hidden" : "overflow-auto"
      )}
    >
      <nav
        aria-label="Categories"
        className="sticky top-0 z-20 flex w-full overflow-auto bg-white shadow snap-x snap-mandatory scroll-smooth gap-2 p-2 "
      >
        {categories?.map((it, index) => (
          <button
            key={it.id}
            ref={navbar.buttonRef(index)}
            onClick={navbar.onClick(index)}
            className={clsx(
              it.identifier === navbar.section
                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700",
              "block flex-shrink-0 rounded-md snap-start scroll-m-2 px-3 py-2 text-sm font-medium"
            )}
          >
            {getTitle(it)}
          </button>
        ))}
      </nav>
      <div className="space-y-8">
        {categories?.map((category, index) => (
          <div key={category.id} className="group">
            <CategoryHeader ref={navbar.sectionRef(index)} category={category} />
            <ul role="list" className="flex flex-col gap-2 group-last:min-h-screen">
              {category.items?.map((item) => {
                const { amount, comment } = getMeta(item)
                return (
                  <ListItem
                    key={item.id}
                    item={item}
                    amountOption={Op.fromNullable(order.get(item)?.amount)}
                    onClick={() => handleShowOrderModal(item)}
                    onAdd={() => order.change(item, { amount: increment(amount), comment })}
                    onRemove={() =>
                      order.change(item, {
                        amount: pipe(amount, decrement, max(0)),
                        comment,
                      })
                    }
                  />
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      <Suspense>
        <LazyViewOrderButton
          show={order.items.length > 0}
          onClick={() => {
            setReviewOrder(true)
          }}
          amount={order.amount}
          price={order.price}
        />
      </Suspense>
      <Suspense>
        <LazyItemModal
          open={open}
          onClose={() => setOpen(false)}
          item={item}
          meta={item && order.get(item)}
          onAddToOrder={handleChangeOrder}
        />
      </Suspense>
      <Suspense>
        <LazyOrderModal
          {...order}
          open={reviewOrder}
          onClose={() => setReviewOrder(false)}
          onOrder={handleOrder}
        />
      </Suspense>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const venues = await db.venue.findMany()

  const locales = Object.values(Locale)
  return {
    fallback: "blocking",
    paths: locales.flatMap((locale) =>
      venues.map((it) => ({ params: { restaurant: it.identifier }, locale }))
    ),
  }
}

const Query = z
  .object({
    restaurant: z.string(),
    table: z.string().default("bar"),
  })
  .default({ restaurant: "none", table: "bar" })

export const getStaticProps = gSP(async (context: GetStaticPropsContext) => {
  const { restaurant: identifier } = Query.parse(context.params)
  const restaurant = await db.venue.findUnique({
    where: { identifier },
    include: {
      content: true,
      categories: {
        include: {
          content: true,
          items: {
            where: {
              deleted: null,
              image: { not: identifier.startsWith("on-the-water") ? "gibbrish" : "" },
            },
            include: {
              content: true,
            },
          },
        },
      },
    },
  })

  if (!restaurant) throw new NotFoundError()

  return {
    props: { restaurant, messages: await import(`app/core/messages/${context.locale}.json`) },
    revalidate: 10,
  }
})
