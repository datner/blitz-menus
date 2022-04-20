import { FormEventHandler } from "react"

export default function Admin() {
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const res = await fetch("/api/uploadItemImage", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data; Boundry: yoink--",
      },
      body: formData,
    })
    console.log(res)
  }
  return (
    <form action="/api/uploadItemImage" method="POST" encType="multipart/form-data">
      <input type="text" name="itemIdentifier" />
      <input type="number" name="restaurantId" />
      <input type="file" name="image" />
      <input type="submit" />
    </form>
  )
}
