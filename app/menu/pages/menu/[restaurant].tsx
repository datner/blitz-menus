import { animated, useSpring } from "@react-spring/web"
import sendOrderMutation, { SendOrderItem } from "app/menu/mutations/sendOrder"
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  useMutation,
  useRouter,
  Image,
} from "blitz"
import clsx from "clsx"
import db, { Locale } from "db"
import { pipe, flow } from "fp-ts/function"
import * as Op from "fp-ts/Option"
import * as O from "monocle-ts/Optional"
import * as L from "monocle-ts/Lens"
import { useRef, useState } from "react"
import { z } from "zod"
import { ItemData } from "app/menu/components/ItemData"
import { Category__Content } from "app/menu/types/menu"
import { OrderModal } from "app/menu/components/OrderModal"
import { zLocale } from "app/core/hooks/useLocale"
import { Item__Content } from "app/menu/types/item"

const STICKY_BAR_HEIGHT = 52

const titleLocale = (locale: Locale) =>
  flow(
    pipe(
      L.id<Category__Content>(),
      L.prop("content"),
      L.findFirst((it) => it.locale === locale),
      O.prop("name")
    ).getOption,
    Op.getOrElse(() => "Unknown")
  )

export default function Menu(props: InferGetStaticPropsType<typeof getStaticProps>) {
  const { restaurant } = props
  const { categories } = restaurant
  const [section, setSection] = useState(categories?.at(0)?.identifier)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<HTMLDivElement[]>([])
  const navsLocations = useRef<HTMLButtonElement[]>([])
  const router = useRouter()
  const locale = zLocale.parse(router.locale)
  const { table } = Query.parse(router.params)
  const [item, setItem] = useState<Item__Content | null>(null)
  const [open, setOpen] = useState(false)

  const itemsRef = useRef<Map<Item__Content, number>>(new Map())
  const [orderItems, setItems] = useState<SendOrderItem[]>([])
  const [overallAmount, setOverallAmount] = useState(0)
  const [overallPrice, setOverallPrice] = useState(0)
  const { y: buttonY } = useSpring({ y: orderItems.length ? 0 : 200 })
  const [sendOrder] = useMutation(sendOrderMutation, {
    onSuccess() {
      itemsRef.current.clear()
      setItems([])
    },
  })

  const getTitle = titleLocale(locale)

  const handleShowOrderModal = (item: Item__Content) => {
    setItem(item)
    setOpen(true)
  }

  const handleOrder = (amount: number) => {
    setOpen(false)
    if (!item) return
    itemsRef.current.set(item, amount)
    const itemTuples = Array.from(itemsRef.current.entries())
    setOverallAmount(itemTuples.reduce((sum, [, amount]) => sum + amount, 0))
    setOverallPrice(itemTuples.reduce((sum, [item, amount]) => sum + item.price * amount, 0))
    setItems(
      itemTuples.map(([item, amount]) => ({
        amount,
        item: { id: item.id },
      }))
    )
  }

  if (!categories) return <>:()</>

  return (
    <div
      ref={scrollContainerRef}
      onScroll={() => {
        const nextSection = categoryRefs.current.findIndex(
          (it) => it.getBoundingClientRect().top > STICKY_BAR_HEIGHT
        )
        const activeIndex = Math.max(nextSection, 0) - 1
        const activeSection = categoryRefs.current.at(activeIndex)
        const activeButton = navsLocations.current.at(activeIndex)
        if (activeSection && section !== activeSection.id) {
          setSection(activeSection.id)
          activeButton?.scrollIntoView({ inline: "start", behavior: "smooth" })
        }
      }}
      className={clsx(
        "relative h-full bg-gray-50 scroll-smooth",
        open ? "overflow-hidden" : "overflow-auto"
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
              const el = categoryRefs.current.at(index)
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
          <div key={category.id}>
            <div
              id={category.identifier}
              ref={(el) => {
                if (!el) return
                categoryRefs.current[index] = el
              }}
              className="mb-2 border-b pl-5 border-gray-200 px-6 py-1 font-medium text-gray-800"
            >
              <h3 className="text-lg sm:text-3xl">{getTitle(category)}</h3>
            </div>
            <ul role="list" className="flex flex-col gap-2">
              {category.items?.map((item) => {
                const content = item.content.find((it) => it.locale === locale)

                if (!content) return null

                return (
                  <li
                    key={item.id}
                    onClick={() => handleShowOrderModal(item)}
                    className="relative px-2 sm:px-6"
                  >
                    <div className="relative flex flex-1 h-28 overflow-hidden rounded-lg bg-white shadow">
                      <div className="flex-shrink-0 flex-grow w-40 overflow-hidden">
                        <ItemData content={content} price={item.price} />
                      </div>
                      <div className="flex-shrink-0 flex relative justify-center items-center">
                        <div className="relative flex-shrink-0 w-32 mr-4 h-20 sm:w-48 sm:h-24 sm:mr-2">
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
              })}
            </ul>
          </div>
        ))}
      </div>
      <animated.button
        style={{ y: buttonY }}
        className="inline-flex fixed inset-x-3 bottom-3 justify-center items-center rounded-md border border-transparent shadow-lg shadow-indigo-300 px-2 py-2 bg-indigo-600 text-base text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
        onClick={() => {
          // sendOrder({ table, restaurantId: restaurant.id, orderItems })
          console.log("sending order with", orderItems)
        }}
      >
        <span className="bg-indigo-100 border text-xs border-indigo-500 text-indigo-800 rounded-full h-6 w-6 flex justify-center items-center">
          {overallAmount}
        </span>
        <span className="inline-block text-left flex-grow pl-3">View Order</span>
        <span className="tracking-wider font-thin">₪{overallPrice}</span>
      </animated.button>
      <OrderModal
        open={open}
        onClose={() => setOpen(false)}
        item={item}
        onAddToOrder={handleOrder}
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

  return { props: { restaurant }, revalidate: 10 }
}
