import { useMutation } from "@blitzjs/rpc"
import LabeledTextField from "app/core/components/LabeledTextField"
import { toShekel } from "app/core/helpers/content"
import { useZodForm } from "app/core/hooks/useZodForm"
import { ItemSchema } from "app/items/validations"
import { useTranslations } from "next-intl"
import { DefaultValues, FormProvider } from "react-hook-form"
import getUploadUrl from "../mutations/getUploadUrl"
import { FormDropzone } from "./FormDropzone"
import { useReducer } from "react"
import { match } from "ts-pattern"
import { FormCategoryCombobox } from "./FormCategoryCombobox"
import { DeleteButton } from "./DeleteButton"
import LabeledTextArea from "app/core/components/LabeledTextArea"
import { pipe, constant, constNull, flow, constTrue } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import * as O from "fp-ts/Option"
import * as Eq from "fp-ts/Eq"
import { PromiseReturnType } from "blitz"
import getItem from "app/items/queries/getItem"
import { Content } from "app/items/validations"
import { Locale } from "@prisma/client"
import { useStableEffect } from "fp-ts-react-stable-hooks"
import { eqItem } from "app/items/helpers/eqItem"
import { nanoid } from "nanoid"
import { toast } from "react-toastify"

type _Item = PromiseReturnType<typeof getItem>

type Props = {
  item: O.Option<_Item>
  onSubmit(data: ItemSchema): TE.TaskEither<string, _Item>
}

const getDefaultValues = constant<DefaultValues<ItemSchema>>({
  identifier: "",
  price: 0,
  en: { name: "", description: "" },
  he: { name: "", description: "" },
  image: { src: "" },
})

const toDefaults = O.match<_Item, DefaultValues<ItemSchema>>(
  getDefaultValues,
  ({ identifier, categoryId, price, content, image, blurDataUrl }): DefaultValues<ItemSchema> => ({
    identifier,
    categoryId,
    price,
    en: Content.parse(content.find((it) => it.locale === Locale.en)),
    he: Content.parse(content.find((it) => it.locale === Locale.he)),
    image: {
      src: image,
      blur: blurDataUrl ?? undefined,
    },
  })
)

export function ItemForm(props: Props) {
  const { onSubmit: onSubmit_, item } = props
  const t = useTranslations("admin.Components.ItemForm")
  const isEdit = O.isSome(item)
  const defaultValues = toDefaults(item)
  const form = useZodForm({
    schema: ItemSchema,
    defaultValues,
  })
  const [getAssetUrl, uploadUrl] = useMutation(getUploadUrl)
  const [isRemoving, remove] = useReducer(() => true, false)

  const { handleSubmit, setFormError, watch, formState, reset } = form
  const { isSubmitting } = formState

  useStableEffect(
    () => {
      pipe(item, toDefaults, reset)
    },
    [item, reset],
    Eq.tuple(O.getEq(eqItem), { equals: constTrue })
  )

  const onSubmit = handleSubmit(async (data) => {
    async function doAction() {
      const { image } = data
      const file = image.file
      try {
        if (file) {
          const { url, headers: h } = await getAssetUrl({
            name: `${data.identifier}-${nanoid()}.${file.name.split(".").pop()}`,
          })
          const headers = new Headers(h)
          headers.append("Content-Length", `${file.size + 5000}`)

          const {
            data: {
              attributes: { origin_path },
            },
          } = await fetch(url, {
            method: "POST",
            headers,
            body: await file.arrayBuffer(),
          }).then((res) => res.json())
          image.src = origin_path
        }
        await pipe(onSubmit_(data), TE.match(setFormError, flow(O.some, toDefaults, reset)))()
      } catch (error: any) {
        setFormError(error.toString())
      }
    }
    const isCreate = O.isNone(item)
    await toast.promise(doAction(), {
      pending: `${isCreate ? "Creating" : "Updating"} in progress...`,
      success: `${data.identifier} ${isCreate ? "created" : "updated"} successfully!`,
      error: `Oops! Couldn't ${isCreate ? "create" : "update"} ${data.identifier}`,
    })
  })

  const result = {
    isEdit,
    isSubmitting,
  }

  const message = match(uploadUrl.isLoading)
    .with(true, () => t("upload"))
    .otherwise(() =>
      match(result)
        .with({ isEdit: false, isSubmitting: true }, () => t("create.item"))
        .with({ isEdit: true, isSubmitting: true }, () => t("update.item"))
        .with({ isEdit: false }, () => t("create.initial"))
        .with({ isEdit: true }, () => t("update.initial"))
        .exhaustive()
    )

  const title = pipe(
    item,
    O.match(
      () => t("title.new"),
      () => t("title.edit")
    )
  )

  const deleteButton = pipe(
    item,
    O.matchW(constNull, (it) => <DeleteButton identifier={it.identifier!} onRemove={remove} />)
  )

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4 h-20 flex">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-emerald-600 grow">
            {title}
          </h1>
          <div>{deleteButton}</div>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting || isRemoving}>
              <div className="flex gap-2 items-center">
                <div className="grow">
                  <LabeledTextField
                    name="identifier"
                    label={t("identifier")}
                    placeholder="my-item"
                  />
                </div>
                <div className="grow">
                  <FormCategoryCombobox />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <LabeledTextField
                  outerProps={{ className: "grow shrink" }}
                  name="price"
                  label={t("price")}
                  registerOptions={{ min: 0, valueAsNumber: true }}
                  placeholder="my-item"
                />
                <pre className="pt-6 basis-32">{toShekel(watch("price") || 0)}</pre>
              </div>
              <div>
                <LabeledTextField name="en.name" label={t("english name")} placeholder="My Item" />
                <LabeledTextArea
                  name="en.description"
                  label={t("english name")}
                  placeholder="My Item"
                />
              </div>
              <div>
                <LabeledTextField name="he.name" label={t("hebrew name")} placeholder="פריט שלי" />
                <LabeledTextArea
                  name="he.description"
                  label={t("english name")}
                  placeholder="My Item"
                />
              </div>
            </fieldset>
            <div className="flex-1 flex flex-col">
              <FormDropzone />
            </div>
          </div>
          <button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:bg-gray-400"
            type="submit"
            disabled={isSubmitting}
          >
            {message}
          </button>
        </form>
      </div>
    </FormProvider>
  )
}
