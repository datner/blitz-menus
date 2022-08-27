import { AuthenticatedMiddlewareCtx, resolver } from "@blitzjs/rpc"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import * as E from "fp-ts/Either"
import * as A from "fp-ts/Array"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import db, { Prisma, Venue } from "db"
import { CreateItem } from "../validations"
import { pipe, flow } from "fp-ts/function"
import { PrismaValidationError } from "app/core/type/prisma"
import * as L from "app/core/helpers/server"
import { z } from "zod"
import { match } from "ts-pattern"

type NoOrgIdError = {
  tag: "noOrgIdError"
  userId: number
}

type NoVenuesError = {
  tag: "noVenuesError"
  orgId: number
}

const getOrgId = (ctx: AuthenticatedMiddlewareCtx) =>
  E.fromNullable<NoOrgIdError>({ tag: "noOrgIdError", userId: ctx.session.userId })(
    ctx.session.orgId
  )

const getFirstVenue = (orgId: number) =>
  pipe(
    () => db.venue.findMany({ where: { organizationId: orgId } }),
    T.chain(
      flow(
        A.head,
        TE.fromOption((): NoVenuesError => ({ tag: "noVenuesError", orgId }))
      )
    )
  )

const createItem = (input: z.infer<typeof CreateItem>) => (venue: Venue) =>
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
  async (input) => ({ ...input, blurDataUrl: await getBlurDataUrl(input.image) }),
  (input, ctx) =>
    pipe(
      getOrgId(ctx),
      TE.fromEither,
      TE.chainW(getFirstVenue),
      TE.chainW(createItem(input)),
      TE.orElseFirstW((e) =>
        TE.of(
          match(e)
            .with({ tag: "noOrgIdError" }, ({ userId }) =>
              L.error(`User ${userId} is not associated with any user`)
            )
            .with({ tag: "noVenuesError" }, ({ orgId }) =>
              L.error(`Org ${orgId} is not associated with any venues`)
            )
            .with({ tag: "prismaValidationError" }, ({ error }) => pipe(error, L.variable, L.error))
            .exhaustive()
        )
      )
    )()
)
