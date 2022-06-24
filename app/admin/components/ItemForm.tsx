import { useMutation, PromiseReturnType } from "blitz"
import LabeledTextField from "app/core/components/LabeledTextField"
import { toShekel } from "app/core/helpers/content"
import { useZodForm } from "app/core/hooks/useZodForm"
import { ItemSchema } from "app/items/validations"
import { useTranslations } from "next-intl"
import { DefaultValues, FormProvider, SubmitHandler } from "react-hook-form"
import getUploadUrl from "../mutations/getUploadUrl"
import { FormDropzone } from "./FormDropzone"
import getItem from "app/items/queries/getItem"
import { useEffect } from "react"
import { Lazy } from "fp-ts/function"
import { FormCategoryCombobox } from "./FormCategoryCombobox"

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

  const { handleSubmit, setFormError, watch, formState, reset } = form
  const { isSubmitting } = formState

  useEffect(() => {
    reset(defaultValues)
  }, [reset, defaultValues])

  const onSubmit = handleSubmit(async (data) => {
    const { image } = data
    const file = image.file as File | undefined
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
    } catch (error: any) {
      setFormError(error.toString())
    }
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600">
            {props.defaultValues ? t("title.edit") : t("title.new")}
          </h1>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting}>
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
              <LabeledTextField name="en.name" label={t("english name")} placeholder="My Item" />
              <LabeledTextField name="he.name" label={t("hebrew name")} placeholder="פריט שלי" />
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
            {isSubmitting
              ? uploadUrl.isLoading
                ? t("submit.image")
                : t("submit.item")
              : t("submit.initial")}
          </button>
        </form>
      </div>
    </FormProvider>
  )
}
