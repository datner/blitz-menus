import { Prisma } from "@prisma/client"

export type PrismaNotFoundError = {
  tag: "prismaNotFoundError"
  error: Prisma.NotFoundError
}
