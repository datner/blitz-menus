import { resolver } from "@blitzjs/rpc"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import db, { Prisma, Venue } from "db"
import { CreateItem } from "../validations"
import { pipe } from "fp-ts/function"
import { PrismaValidationError } from "app/core/type/prisma"
import * as L from "app/core/helpers/server"
import { z } from "zod"
import { setDefaultOrganizationIdNoFilter } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "app/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "app/core/helpers/revalidation"

const createItem = ({
  venue,
  ...input
}: z.infer<typeof CreateItem> & { venue: Venue; blurDataUrl: string | undefined }) =>
  TE.tryCatch(
    () =>
      db.item.create({
        data: {
          ...input,
          organizationId: venue.organizationId,
          Venue: { connect: { id: venue.id } },
        },
        include: {
          content: true,
        },
      }),
    (err): PrismaValidationError => ({
      tag: "prismaValidationError",
      error: err as Prisma.PrismaClientValidationError,
    })
  )

export default resolver.pipe(
  resolver.zod(CreateItem),
  resolver.authorize(),
  setDefaultOrganizationIdNoFilter,
  setDefaultVenue,
  (input) =>
    pipe(
      T.of(input),
      T.apS("blurDataUrl", () => getBlurDataUrl(input.image)),
      TE.fromTask,
      TE.chain(createItem),
      TE.chainFirstW(() => revalidateVenue(input.venue.identifier)),
      TE.orElseFirst(TE.fromIOK((e) => pipe(e, L.variable, L.error)))
    )()
)
