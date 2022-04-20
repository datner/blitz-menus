import { extname } from "path"
import multer from "multer"
import axios from "axios"
import { z } from "zod"
import { BlitzApiRequest, BlitzApiResponse } from "blitz"

const UploadItemImage = z.object({
  itemIdentifier: z.string(),
  restaurantId: z.string(),
})

const upload = multer({ storage: multer.memoryStorage() })

const handler = async (
  req: Express.Request & BlitzApiRequest,
  res: Express.Response & BlitzApiResponse
) => {
  await new Promise((resolve) => {
    const mu = upload.single("image")
    mu(req as any, res as any, resolve)
  })
  const { itemIdentifier } = UploadItemImage.parse(req.body)
  const file = req.file as Express.Multer.File
  const filetype = extname(file.originalname)

  const { data } = await axios.post(
    `https://api.imgix.com/api/v1/sources/${process.env.IMGIX_SOURCE_ID}/upload/items/${itemIdentifier}.${filetype}`,
    Uint8Array.from(file.buffer),
    {
      headers: {
        Authorization: `Bearer ${process.env.IMGIX_API_KEY}`,
      },
    }
  )

  res.status(200).json(data)
}

export default handler

export const config = {
  api: {
    bodyParser: false,
  },
}
