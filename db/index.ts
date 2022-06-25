import { enhancePrisma } from "blitz"
import { Prisma, PrismaClient } from "@prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

const canSoftDelete: Prisma.ModelName[] = ["Menu", "Restaurant", "Item", "Category"]

function getClient() {
  const db = new EnhancedPrisma()

  // Soft Delete Middleware
  db.$use(async (params, next) => {
    if (params.model && canSoftDelete.includes(params.model)) {
      const data = { deleted: new Date() }
      switch (params.action) {
        case "delete": {
          params.action = "update"
          params.args["data"] = data
        }

        case "deleteMany": {
          params.action = "updateMany"
          params.args["data"] = params.args.data ? { ...params.args.data, ...data } : data
        }
      }
    }

    return next(params)
  })

  return db
}

export * from "@prisma/client"
export default getClient()
