import type { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType } from "blitz"
import type { Item__Content } from "app/menu/types/item"

import clsx from "clsx"
import db, { Locale } from "db"
import * as Op from "fp-ts/Option"
import { lazy, Suspense, useState } from "react"
import { z } from "zod"
import { useLocale } from "app/core/hooks/useLocale"
import { titleFor } from "app/core/helpers/content"
import { ListItem } from "app/menu/components/ListItem"
import { CategoryHeader } from "app/menu/components/CategoryHeader"
import { useOrder } from "app/menu/hooks/useOrder"
import { useNavBar } from "app/menu/hooks/useNavBar"

const LazyViewOrderButton = lazy(() => import("app/menu/components/ViewOrderButton"))
const LazyItemModal = lazy(() => import("app/menu/components/ItemModal"))
const LazyOrderModal = lazy(() => import("app/menu/components/OrderModal"))

export default function Menu(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { restaurant } = props
  const { categories } = restaurant
  const navbar = useNavBar({ initialActive: categories?.[0]?.identifier })
  const locale = useLocale()
  const order = useOrder()
  const [item, setItem] = useState<Item__Content | null>(null)
  const [open, setOpen] = useState(false)
  const [reviewOrder, setReviewOrder] = useState(false)

  const handleShowOrderModal = (item: Item__Content) => {
    setItem(item)
    setOpen(true)
  }

  const handleOrder = (amount: number) => {
    if (!item) return
    order.change(item, amount)
  }

  if (!categories) return <>:()</>

  const getTitle = titleFor(locale)

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
              {category.items?.map((item) => (
                <ListItem
                  key={item.id}
                  item={item}
                  amountOption={Op.fromNullable(order.get(item))}
                  onClick={() => handleShowOrderModal(item)}
                />
              ))}
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
          previousAmount={item && order.get(item)}
          onAddToOrder={handleOrder}
        />
      </Suspense>
      <Suspense>
        <LazyOrderModal {...order} open={reviewOrder} onClose={() => setReviewOrder(false)} />
      </Suspense>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const restaurants = await db.restaurant.findMany()

  return {
    fallback: "blocking",
    paths: restaurants.map((it) => ({ params: { restaurant: it.slug }, locale: Locale.en })),
  }
}

const Query = z
  .object({
    restaurant: z.string(),
    table: z.string().default("bar"),
  })
  .default({ restaurant: "none", table: "bar" })

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { restaurant: slug } = Query.parse(context.params)
  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    rejectOnNotFound: true,
    include: {
      content: true,
      categories: {
        include: {
          content: true,
          items: {
            include: {
              content: true,
            },
          },
        },
      },
    },
  })

  return {
    props: { restaurant, messages: await import(`app/menu/messages/${context.locale}.json`) },
    revalidate: 10,
  }
}
