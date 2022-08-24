import { Ctx } from "@blitzjs/next"
import { resolver } from "@blitzjs/rpc"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import * as A from "fp-ts/Array"
import * as NEA from "fp-ts/NonEmptyArray"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import db, { Prisma, Venue } from "db"
import { CreateItem } from "../validations"
import { pipe, constant } from "fp-ts/function"
import { PrismaValidationError } from "app/core/type/prisma"
import { fpLog } from "app/core/helpers/server"
import { z } from "zod"

type NoOrgIdError = {
  tag: "noOrgIdError"
}

type NoVenuesError = {
  tag: "noVenuesError"
  orgId: number
}

const constNoOrg = constant<NoOrgIdError>({ tag: "noOrgIdError" })

const headFromArray =
  <E>(err: E) =>
  <V>(arr: V[]): E.Either<E, V> =>
    A.isNonEmpty(arr) ? E.right(NEA.head(arr)) : E.left(err)

const getFirstVenue = (ctx: Ctx) =>
  pipe(
    ctx.session.orgId,
    E.fromNullable(constNoOrg()),
    E.bindTo("orgId"),
    TE.fromEither,
    TE.bind("venues", ({ orgId }) =>
      TE.fromTask(() => db.venue.findMany({ where: { organizationId: orgId } }))
    ),
    TE.bindW("venue", ({ venues, orgId }) =>
      TE.fromEither(headFromArray<NoVenuesError>({ tag: "noVenuesError", orgId })(venues))
    )
  )

interface CreateItemContext {
  venues: Venue[]
  venue: Venue
  orgId: number
  input: z.infer<typeof CreateItem>
}

const createItem = ({ input, orgId, venue }: CreateItemContext) =>
  TE.tryCatch(
    () =>
      db.item.create({
        data: { ...input, organizationId: orgId, Venue: { connect: { id: venue.id } } },
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
      getFirstVenue(ctx),
      TE.bind("input", () => TE.of(input)),
      TE.chainW(createItem),
      TE.orElseFirstW((e) => TE.of(fpLog.log(e)())),
      TE.chainFirstIOK(fpLog.log)
    )()
)
