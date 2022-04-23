import { GetStaticPaths, GetStaticPropsContext, InferGetStaticPropsType, useRouter } from "blitz"
import clsx from "clsx"
import db, { Locale } from "db"
import * as Op from "fp-ts/Option"
import { useRef, useState } from "react"
import { z } from "zod"
import { ItemModal } from "app/menu/components/ItemModal"
import { useLocale } from "app/core/hooks/useLocale"
import { Item__Content } from "app/menu/types/item"
import { FullOrderItem, OrderModal } from "app/menu/components/OrderModal"
import { titleFor } from "app/core/helpers/content"
import { ViewOrderButton } from "app/menu/components/ViewOrderButton"
import { ListItem } from "app/menu/components/ListItem"
import { CategoryHeader } from "app/menu/components/CategoryHeader"

const STICKY_BAR_HEIGHT = 52

export default function Menu(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { restaurant } = props
  const { categories } = restaurant
  const [section, setSection] = useState(categories?.[0]?.identifier)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<HTMLDivElement[]>([])
  const navsLocations = useRef<HTMLButtonElement[]>([])
  const router = useRouter()
  const locale = useLocale()
  const { table } = Query.parse(router.params)
  const [item, setItem] = useState<Item__Content | null>(null)
  const [open, setOpen] = useState(false)
  const [open2, setOpen2] = useState(false)

  const itemsRef = useRef<Map<Item__Content, number>>(new Map())
  const [orderItems, setItems] = useState<FullOrderItem[]>([])
  const [overallAmount, setOverallAmount] = useState(0)
  const [overallPrice, setOverallPrice] = useState(0)

  const getTitle = titleFor(locale)

  const handleShowOrderModal = (item: Item__Content) => {
    setItem(item)
    setOpen(true)
  }

  const changeOrder = (item: Item__Content, amount: number) => {
    amount === 0 ? itemsRef.current.delete(item) : itemsRef.current.set(item, amount)

    const itemTuples = Array.from(itemsRef.current.entries())
    setOverallAmount(itemTuples.reduce((sum, [, amount]) => sum + amount, 0))
    setOverallPrice(itemTuples.reduce((sum, [item, amount]) => sum + item.price * amount, 0))
    setItems(
      itemTuples.map(([item, amount]) => ({
        amount,
        item,
      }))
    )
  }

  const handleOrder = (amount: number) => {
    if (!item) return
    changeOrder(item, amount)
  }

  if (!categories) return <>:()</>

  return (
    <div
      ref={scrollContainerRef}
      onScroll={() => {
        const nextSection = categoryRefs.current.findIndex(
          (it) => it.getBoundingClientRect().top > STICKY_BAR_HEIGHT
        )
        const activeIndex =
          nextSection === -1 ? categoryRefs.current.length - 1 : Math.max(nextSection, 1) - 1
        const activeSection = categoryRefs.current[activeIndex]
        const activeButton = navsLocations.current[activeIndex]
        if (activeSection && section !== activeSection.id) {
          setSection(activeSection.id)
          activeButton?.scrollIntoView({ inline: "start", behavior: "smooth" })
        }
      }}
      className={clsx(
        "relative h-full bg-gray-50 scroll-smooth",
        open || open2 ? "overflow-hidden" : "overflow-auto"
      )}
    >
      <nav
        aria-label="Categories"
        className="sticky top-0 z-20 flex w-full overflow-auto bg-white shadow snap-x snap-mandatory scroll-smooth gap-2 p-2 "
      >
        {categories?.map((it, index) => (
          <button
            ref={(el) => {
              if (!el) return
              navsLocations.current[index] = el
            }}
            onClick={() => {
              const el = categoryRefs.current[index]
              if (!scrollContainerRef.current || !el) return

              const top = el.offsetTop - STICKY_BAR_HEIGHT
              scrollContainerRef.current.scroll({ top, behavior: "smooth" })
            }}
            key={it.id}
            className={clsx(
              it.identifier === section
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
            <CategoryHeader
              ref={(el) => {
                if (!el) return
                categoryRefs.current[index] = el
              }}
              category={category}
            />
            <ul role="list" className="flex flex-col gap-2 group-last:min-h-screen">
              {category.items?.map((item) => (
                <ListItem
                  key={item.id}
                  item={item}
                  amountOption={Op.fromNullable(itemsRef.current.get(item))}
                  onClick={() => handleShowOrderModal(item)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      <ViewOrderButton
        show={orderItems.length > 0}
        onClick={() => {
          // sendOrder({ table, restaurantId: restaurant.id, orderItems })
          setOpen2(true)
        }}
        amount={overallAmount}
        price={overallPrice}
      />
      <ItemModal
        open={open}
        onClose={() => setOpen(false)}
        item={item}
        previousAmount={item && itemsRef.current.get(item)}
        onAddToOrder={handleOrder}
      />
      <OrderModal
        overallAmount={overallAmount}
        overallPrice={overallPrice}
        onOrderChange={changeOrder}
        open={open2}
        onClose={() => setOpen2(false)}
        items={orderItems}
      />
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
