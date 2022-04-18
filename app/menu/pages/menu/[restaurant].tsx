import { animated, useSpring } from "@react-spring/web"
import sendOrderMutation, { SendOrderItem } from "app/menu/mutations/sendOrder"
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  useMutation,
  useRouter,
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

const zLocale = z.nativeEnum(Locale).default(Locale.en)

type Unarray<T> = T extends Array<infer U> ? U : T

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
  const [items, setItems] = useState<SendOrderItem[]>([])
  const { y: buttonY } = useSpring({ y: items.length ? 0 : 200 })
  const [sendOrder] = useMutation(sendOrderMutation, {
    onSuccess() {
      setItems([])
    },
  })

  const getTitle = titleLocale(locale)

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
      className="relative h-full bg-gray-50 scroll-smooth overflow-auto"
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
              <h3 className="text-3xl">{getTitle(category)}</h3>
            </div>
            <ul role="list" className="flex flex-col gap-2">
              {category.items?.map((item) => {
                const content = item.content.find((it) => it.locale === locale)

                if (!content) return null

                return (
                  <li
                    key={item.id}
                    onClick={() => setItems((prev) => [...prev, item])}
                    className="relative px-2"
                  >
                    <div className="relative flex flex-1 overflow-hidden rounded-lg bg-white object-fill shadow">
                      <ItemData content={content} price={item.price} />
                      <div className="relative h-28 w-56 flex-shrink-0 translate-x-1/4 bg-gray-500 rtl:-translate-x-1/4">
                        <div className="absolute inset-y-0 -left-px right-1/2 bg-gradient-to-r from-white rtl:left-1/2 rtl:-right-px rtl:bg-gradient-to-l" />
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
        className="fixed bottom-3 right-3"
        onClick={() => sendOrder({ table, restaurantId: restaurant.id, items })}
      >
        {items.length}
      </animated.button>
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
