import { Image } from "blitz"
import { Fragment, useEffect, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Item__Content } from "../types/item"
import { useLocale } from "app/core/hooks/useLocale"
import { flow, pipe, decrement, increment } from "fp-ts/function"
import { PlusIcon, MinusIcon } from "@heroicons/react/solid"
import * as O from "monocle-ts/Optional"
import * as Op from "fp-ts/Option"
import * as E from "fp-ts/Either"
import { Locale, Item, ItemI18L } from "db"
import clsx from "clsx"
import { Nullish } from "../types/utils"

type Props = {
  open?: boolean
  onClose(): void
  onAddToOrder(amount: number): void
  item: Item__Content | null
  previousAmount?: Nullish<number>
}

const contentOption = (prop: keyof ItemI18L, locale: Locale) =>
  pipe(
    O.id<Item__Content | null>(),
    O.fromNullable,
    O.prop("content"),
    O.findFirst((it) => it.locale === locale),
    O.prop(prop)
  ).getOption

const priceOption = pipe(O.id<Item | null>(), O.fromNullable, O.prop("price")).getOption

const get = <T, O>(option: (as: T) => Op.Option<O>, fallback: O) =>
  flow(
    option,
    Op.getOrElse(() => fallback)
  )

const contentGet = (prop: keyof ItemI18L, locale: Locale) => get(contentOption(prop, locale), "")
const price = get(priceOption, 0)

export function OrderModal(props: Props) {
  const { open, onClose, onAddToOrder, item, previousAmount } = props
  const isEditOrder = typeof previousAmount === "number"
  const locale = useLocale()
  const title = contentGet("name", locale)
  const desc = contentGet("description", locale)
  const [amount, setAmount] = useState(1)
  const [shouldUpdate, setShouldUpdate] = useState(false)
  const orderState = isEditOrder
    ? amount === 0 || amount === previousAmount
      ? OrderState.REMOVE
      : OrderState.UPDATE
    : OrderState.NEW

  const updateAmount = amount === previousAmount || amount === 0 ? 0 : amount

  useEffect(() => {
    setAmount(previousAmount ?? 1)
  }, [previousAmount])

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed isolate z-50 inset-0 overflow-y-auto" onClose={onClose}>
        <div className="flex relative items-end justify-center min-h-screen text-center sm:block">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            afterLeave={() => shouldUpdate && onAddToOrder(updateAmount)}
          >
            <div className="absolute inset-x-0 bottom-0 inline-block w-full align-bottom bg-white rounded-lg p-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div className="relative -mx-4 -mt-4 h-56">
                {item && (
                  <Image
                    src={`${item.image}?fit=crop&crop=entropy&h=${200 * 4}`}
                    layout="fill"
                    objectFit="cover"
                    alt={item.identifier}
                  />
                )}
              </div>
              <div className="mt-3 sm:mt-5">
                <Dialog.Title as="h3" className="text-3xl leading-6 font-medium text-gray-900">
                  {title(item)}
                </Dialog.Title>
                <p className="mt-2 text-indigo-600">₪ {price(item)}</p>
                <Dialog.Description className="mt-2 text-sm text-gray-500">
                  {desc(item)}
                </Dialog.Description>
              </div>
              <div className="mt-5 sm:mt-6 grid gap-4 grid-cols-[minmax(7rem,_1fr)_2fr]">
                <AmountButtons minimum={isEditOrder ? 0 : 1} amount={amount} onChange={setAmount} />
                <button
                  type="button"
                  className={clsx(
                    "inline-flex justify-center items-center w-full rounded-md border border-transparent shadow-sm px-2 sm:px-4 sm:py-2 text-xs whitespace-nowrap font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2  sm:text-base",
                    orderState === OrderState.REMOVE
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                  )}
                  onClick={() => {
                    setShouldUpdate(true)
                    onClose()
                  }}
                >
                  <CallToActionText
                    price={price(item) * amount}
                    multi={Boolean(previousAmount && previousAmount > 1)}
                    orderState={orderState}
                  />
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

interface CallToActionTextProps {
  price: number
  orderState: OrderState
  multi: boolean
}

const OrderState = {
  NEW: "NEW",
  UPDATE: "UPDATE",
  REMOVE: "REMOVE",
} as const

type OrderState = typeof OrderState[keyof typeof OrderState]

function CallToActionText(props: CallToActionTextProps) {
  const { price, orderState, multi } = props
  switch (orderState) {
    case OrderState.NEW:
      return (
        <>
          <span className="inline-block text-left font-medium flex-grow">Add to order</span>
          <span className="tracking-wider">₪{price}</span>
        </>
      )

    case OrderState.UPDATE:
      return (
        <>
          <span className="inline-block text-left font-medium flex-grow">Update order</span>
          <span className="tracking-wider">₪{price}</span>
        </>
      )

    case OrderState.REMOVE:
      return (
        <span className="inline-block text-left font-medium flex-grow">
          Remove {multi && "all"}
        </span>
      )
  }
}

interface AmountButtonsProps {
  amount: number
  onChange(amount: number): void
  minimum: number
}

function AmountButtons(props: AmountButtonsProps) {
  const { amount, onChange, minimum } = props

  return (
    <span className="relative z-0 inline-flex shadow-sm rounded-md">
      <button
        type="button"
        onClick={() => amount > minimum && onChange(decrement(amount))}
        disabled={amount <= minimum}
        className="relative disabled:text-gray-300 inline-flex items-center bg-indigo-50 focus:bg-indigo-200 px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium text-indigo-500 focus:text-indigo-800 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <span className="sr-only">Decrement</span>
        <MinusIcon className="h-5 w-5" aria-hidden="true" />
      </button>
      <span className="relative flex-grow inline-flex items-center justify-center px-2 py-2 border-y border-gray-300 bg-white text-sm font-medium text-gray-500">
        {amount}
      </span>
      <button
        type="button"
        onClick={() => onChange(increment(amount))}
        className="-ml-px relative inline-flex items-center px-2 py-2 bg-indigo-50 focus:bg-indigo-200 rounded-r-md border border-gray-300 text-sm font-medium text-indigo-500 focus:text-indigo-800 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <span className="sr-only">Increment</span>
        <PlusIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </span>
  )
}
