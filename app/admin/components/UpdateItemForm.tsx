import getUploadUrl from "app/admin/mutations/getUploadUrl"
import LabeledTextField from "app/core/components/LabeledTextField"
import { useEvent } from "app/core/hooks/useEvent"
import { useZodForm } from "app/core/hooks/useZodForm"
import updateItem from "app/items/mutations/updateItem"
import getItem from "app/items/queries/getItem"
import { Content, UpdateItemSchema } from "app/items/validations"
import { useMutation, useQuery, Image } from "blitz"
import { Locale } from "db"
import { useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FormProvider } from "react-hook-form"

type Props = {
  id: number
}

export function UpdateItemForm(props: Props) {
  const { id } = props
  const [item] = useQuery(getItem, { id })
  const [getAssetUrl] = useMutation(getUploadUrl)
  const [updateItemMutation] = useMutation(updateItem)
  const [file, setFile] = useState<(File & { preview: string }) | undefined>()
  const [message, setMessage] = useState("Update Item")
  const { image } = item

  const form = useZodForm({ schema: UpdateItemSchema })

  const { formState, handleSubmit, setFormError, reset } = form
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
  }, [id, resetForm])

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
        setMessage("Uploading Image...")
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
      setMessage("Updating Item...")

      await updateItemMutation({
        id,
        ...(data as typeof data & { image?: string }),
      })
    } catch (error: any) {
      setFormError(error.toString())
    }
    setMessage("Update Item")
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600">
            Edit an Item
          </h1>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting}>
              <LabeledTextField name="identifier" label="Identifier" placeholder="my-item" />
              <LabeledTextField name="en.name" label="English Name" placeholder="My Item" />
              <LabeledTextField name="he.name" label="Hebrew Name" placeholder="פריט שלי" />
            </fieldset>
            <div className="flex-1 flex flex-col">
              <span className="block text-sm font-medium text-gray-700">Image</span>
              <div
                {...getRootProps()}
                className="p-2 mt-1 rounded-md cursor-pointer border border-gray-300 bg-gray-100 border-dashed"
              >
                <input {...getInputProps()} />
                <span className="text-gray-400 text-sm">
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <p>Drag n drop some files here, or click to select files</p>
                  )}
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
                  <Image alt="preview" objectFit="cover" layout="fill" src={image} />
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