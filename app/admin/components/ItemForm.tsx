import { useMutation } from "@blitzjs/rpc"
import { PromiseReturnType } from "blitz"
import LabeledTextField from "app/core/components/LabeledTextField"
import { toShekel } from "app/core/helpers/content"
import { useZodForm } from "app/core/hooks/useZodForm"
import { ItemSchema } from "app/items/validations"
import { useTranslations } from "next-intl"
import { DefaultValues, FormProvider, SubmitHandler } from "react-hook-form"
import getUploadUrl from "../mutations/getUploadUrl"
import { FormDropzone } from "./FormDropzone"
import getItem from "app/items/queries/getItem"
import { useEffect, useReducer } from "react"
import { match } from "ts-pattern"
import { FormCategoryCombobox } from "./FormCategoryCombobox"
import { DeleteButton } from "./DeleteButton"
import LabeledTextArea from "app/core/components/LabeledTextArea"

type Props = {
  item?: PromiseReturnType<typeof getItem>
  onSubmit: SubmitHandler<ItemSchema>
  defaultValues?: DefaultValues<ItemSchema>
}

const DEFAULT_VALUES: DefaultValues<ItemSchema> = {
  identifier: "",
  price: 0,
  en: { name: "", description: "" },
  he: { name: "", description: "" },
  image: { src: "" },
}

export function ItemForm(props: Props) {
  const { defaultValues = DEFAULT_VALUES, onSubmit: onSubmit_ } = props
  const t = useTranslations("admin.Components.ItemForm")
  const form = useZodForm({
    schema: ItemSchema,
    defaultValues,
  })
  const [getAssetUrl, uploadUrl] = useMutation(getUploadUrl)
  const [isRemoving, remove] = useReducer(() => true, false)

  const { handleSubmit, setFormError, watch, formState, reset } = form
  const { isSubmitting } = formState

  useEffect(() => {
    reset(defaultValues)
  }, [reset, defaultValues])

  const onSubmit = handleSubmit(async (data) => {
    const { image } = data
    const file = image.file
    try {
      if (file) {
        const { url, headers: h } = await getAssetUrl({
          name: `${data.identifier}.${file.name.split(".").pop()}`,
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
      await onSubmit_(data)
      reset(DEFAULT_VALUES)
    } catch (error: any) {
      setFormError(error.toString())
    }
  })

  const result = {
    defaultValues: Boolean(props.defaultValues),
    isSubmitting,
  }

  const message = match(uploadUrl.isLoading)
    .with(true, () => t("upload"))
    .otherwise(() =>
      match(result)
        .with({ defaultValues: false, isSubmitting: true }, () => t("create.item"))
        .with({ defaultValues: true, isSubmitting: true }, () => t("update.item"))
        .with({ defaultValues: false }, () => t("create.initial"))
        .with({ defaultValues: true }, () => t("update.initial"))
        .exhaustive()
    )

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4 h-20 flex">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600 grow">
            {props.defaultValues ? t("title.edit") : t("title.new")}
          </h1>
          <div>
            {props.defaultValues?.identifier && (
              <DeleteButton identifier={props.defaultValues.identifier} onRemove={remove} />
            )}
          </div>
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
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
