import getUploadUrl from "app/admin/mutations/getUploadUrl"
import LabeledTextField from "app/core/components/LabeledTextField"
import { toShekel } from "app/core/helpers/content"
import { useEvent } from "app/core/hooks/useEvent"
import { useZodForm } from "app/core/hooks/useZodForm"
import updateItem from "app/items/mutations/updateItem"
import getItem from "app/items/queries/getItem"
import getItems from "app/items/queries/getItems"
import { Content, UpdateItemSchema } from "app/items/validations"
import { useMutation, useQuery, Image, invalidateQuery } from "blitz"
import { Locale } from "db"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FormProvider } from "react-hook-form"

type Props = {
  identifier: string
}

export function UpdateItemForm(props: Props) {
  const { identifier } = props
  const [item, { setQueryData }] = useQuery(getItem, { identifier })
  const t = useTranslations("admin.Components.UpdateItemForm")
  const [getAssetUrl] = useMutation(getUploadUrl)
  const [updateItemMutation] = useMutation(updateItem)
  const [file, setFile] = useState<(File & { preview: string }) | undefined>()
  const [message, setMessage] = useState(t("submit.initial"))
  const { image, blurDataUrl } = item

  const form = useZodForm({ schema: UpdateItemSchema, defaultValues: { price: 0 } })

  const { formState, handleSubmit, setFormError, reset, watch } = form
  const { isSubmitting } = formState

  const resetForm = useEvent(() => {
    const { content, identifier, price } = item
    reset({
      identifier,
      price,
      en: Content.parse(content.find((it) => it.locale === Locale.en)),
      he: Content.parse(content.find((it) => it.locale === Locale.he)),
    })
    setFile(undefined)
  })

  useEffect(() => {
    resetForm()
  }, [identifier, resetForm])

  const onDrop = useEvent((acceptedFiles: File[]) => {
    const [file] = acceptedFiles
    if (!file) return
    setFile(Object.assign(file, { preview: URL.createObjectURL(file) }))
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (file) {
        setMessage(t("submit.image"))
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
        Object.assign(data, { image: origin_path })
      }
      setMessage(t("submit.item"))

      const newItem = await updateItemMutation({
        id: item.id,
        identifier,
        ...(data as typeof data & { image?: string }),
      })

      setQueryData(newItem)
      invalidateQuery(getItems)
    } catch (error: any) {
      setFormError(error.toString())
    }
    setMessage(t("submit.initial"))
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600">
            {t("title")}
          </h1>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting}>
              <LabeledTextField name="identifier" label={t("identifier")} placeholder="my-item" />
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
              <span className="block text-sm font-medium text-gray-700">Image</span>
              <div
                {...getRootProps()}
                className="p-2 mt-1 rounded-md cursor-pointer border border-gray-300 bg-gray-100 border-dashed"
              >
                <input {...getInputProps()} />
                <span className="text-gray-400 text-sm">
                  {isDragActive ? <p>{t("drop files here")}</p> : <p>{t("drag and drop here")}</p>}
                </span>
              </div>

              <div className="mt-2 relative grow">
                {file ? (
                  <Image
                    unoptimized
                    alt="preview"
                    objectFit="cover"
                    layout="fill"
                    src={file.preview}
                  />
                ) : image ? (
                  <Image
                    alt="preview"
                    objectFit="cover"
                    layout="fill"
                    src={image}
                    blurDataURL={blurDataUrl ?? undefined}
                  />
                ) : null}
              </div>
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
