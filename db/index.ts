import { EnhancedPrismaClientAddedMethods, enhancePrisma } from "blitz"
import { PrismaClient } from "@prisma/client"

const EnhancedPrisma = enhancePrisma(PrismaClient)

// add prisma to the NodeJS global type
declare global {
  var db: PrismaClient & EnhancedPrismaClientAddedMethods
}

// Prevent multiple instances of Prisma Client in development
const db = global.db || new EnhancedPrisma()

if (process.env.NODE_ENV === "development") global.db = db

export * from "@prisma/client"
export default db
