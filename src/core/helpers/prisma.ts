import { Prisma } from "@prisma/client"
import { PrismaNotFoundError, PrismaValidationError } from "src/core/type/prisma"
import db from "db"
import { tryCatch } from "fp-ts/TaskEither"

export const prismaNotFound = (e: unknown): PrismaNotFoundError => ({
  tag: "prismaNotFoundError",
  error: e as Prisma.NotFoundError,
})

export const prismaNotValid = (e: unknown): PrismaValidationError => ({
  tag: "prismaValidationError",
  error: e as Prisma.PrismaClientValidationError,
})

export const getVenueById =
  <Include extends Prisma.VenueInclude>(include: Include) =>
  (id: number) =>
    tryCatch(
      () =>
        db.venue.findUniqueOrThrow({
          where: { id },
          include,
        }),
      prismaNotFound
    )

export const getVenueByIdentifier =
  <Include extends Prisma.VenueInclude>(include?: Include) =>
  (identifier: string) =>
    tryCatch(
      () =>
        db.venue.findUniqueOrThrow({
          where: { identifier },
          include,
        }),
      prismaNotFound
    )
