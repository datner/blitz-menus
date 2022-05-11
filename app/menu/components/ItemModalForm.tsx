import { LabeledTextArea } from "app/core/components/LabeledTextArea"
import { useZodForm } from "app/core/hooks/useZodForm"
import clsx from "clsx"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import { useController } from "react-hook-form"
import { OrderMeta } from "../types/item"
import { Nullish } from "../types/utils"
import { ItemForm } from "../validations/item"
import { AmountButtons } from "./AmountButtons"

interface ItemModalFormProps {
  price: number
  meta: Nullish<OrderMeta>
  // Note on containerEl: this is a filthy dirty hack because I can't find a fuck to do it right
  containerEl: HTMLElement | null
  onSubmit(data: ItemForm): void
}

const OrderState = {
  NEW: "NEW",
  UPDATE: "UPDATE",
  REMOVE: "REMOVE",
} as const

type OrderState = typeof OrderState[keyof typeof OrderState]

const DefaultValues = ItemForm.default({
  amount: 1,
  comment: "",
})

export function ItemModalForm(props: ItemModalFormProps) {
  const { price, meta, onSubmit, containerEl } = props
  const defaultValues = DefaultValues.parse(meta)
  const t = useTranslations("Components.ItemModal")

  const { control, bind, handleSubmit, formState } = useZodForm({
    schema: ItemForm,
    defaultValues,
  })

  const { isDirty } = formState

  const { field } = useController({ control, name: "amount" })
  const amount = field.value

  const orderState = meta
    ? amount === 0 || !isDirty
      ? OrderState.REMOVE
      : OrderState.UPDATE
    : OrderState.NEW

  const submitOrRemove = handleSubmit((data) => {
    onSubmit(orderState === OrderState.REMOVE ? { amount: 0, comment: "" } : data)
  })

  return (
    <form id="item-form" onSubmit={submitOrRemove}>
      <LabeledTextArea label={t("comment")} {...bind("comment")} rows={4} />
      {containerEl &&
        createPortal(
          <div className="mt-6 sticky bottom-4 mx-2 flex gap-2">
            <div className="basis-32">
              <AmountButtons minimum={meta ? 0 : 1} amount={amount} onChange={field.onChange} />
            </div>
            <button
              form="item-form"
              type="submit"
              className={clsx(
                "inline-flex grow justify-center items-center rounded-md border border-transparent shadow-sm px-2 sm:px-4 py-2 text-xs whitespace-nowrap font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2  sm:text-base",
                orderState === OrderState.REMOVE
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              )}
            >
              <CallToActionText
                price={price * amount}
                multi={defaultValues.amount > 1}
                orderState={orderState}
              />
            </button>
          </div>,
          containerEl
        )}
    </form>
  )
}

interface CallToActionTextProps {
  price: number
  orderState: OrderState
  multi: boolean
}

function CallToActionText(props: CallToActionTextProps) {
  const { price, orderState, multi } = props
  const t = useTranslations("Components.CallToActionText")
  switch (orderState) {
    case OrderState.NEW:
      return (
        <>
          <span className="inline-block text-left rtl:text-right font-medium flex-grow">
            {t("new")}
          </span>
          <span className="tracking-wider">₪{price}</span>
        </>
      )

    case OrderState.UPDATE:
      return (
        <>
          <span className="inline-block rtl:text-right font-medium flex-grow">{t("update")}</span>
          <span className="tracking-wider">₪{price}</span>
        </>
      )

    case OrderState.REMOVE:
      return (
        <span className="inline-block rtl:text-right font-medium flex-grow">
          {t("remove._")} {multi && t("remove.all")}
        </span>
      )
  }
}
