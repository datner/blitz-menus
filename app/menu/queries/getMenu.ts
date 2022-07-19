import { resolver } from "@blitzjs/rpc"
import db from "db"
import { z } from "zod"

const GetMenu = z.object({
  slug: z.string(),
})

export default resolver.pipe(resolver.zod(GetMenu), ({ slug }) =>
  db.restaurant.findUnique({
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
)
