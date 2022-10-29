import { resolver } from "@blitzjs/rpc"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import * as A from "fp-ts/Array"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import db, { Prisma, Venue } from "db"
import { CreateItem } from "../validations"
import { pipe, tuple } from "fp-ts/function"
import { PrismaValidationError } from "app/core/type/prisma"
import * as L from "app/core/helpers/server"
import { z } from "zod"
import { setDefaultOrganizationIdNoFilter } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "app/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "app/core/helpers/revalidation"

const createItem = ({
  venue,
  modifiers,
  ...data
}: z.infer<typeof CreateItem> & { venue: Venue; blurDataUrl: string | undefined }) =>
  TE.tryCatch(
    () => {
      const modifiersWithPosition = pipe(modifiers, A.mapWithIndex(tuple))
      return db.item.create({
        include: { content: true, modifiers: true },
        data: {
          ...data,
          organizationId: venue.organizationId,
          Venue: { connect: { id: venue.id } },
          modifiers: {
            create: pipe(
              modifiersWithPosition,
              A.filter(([, m]) => m.modifierId == null),
              A.map(([p, m]) => ({
                position: p,
                config: {
                  ...m.config,
                  content: [
                    { locale: "en", ...m.config.content.en },
                    { locale: "he", ...m.config.content.he },
                  ],
                  options: pipe(
                    m.config.options,
                    A.mapWithIndex((i, o) => ({
                      ...o,
                      position: i,
                      content: [
                        { locale: "en", ...o.content.en },
                        { locale: "he", ...o.content.he },
                      ],
                    })),
                    A.map((o) =>
                      m.config._tag === "oneOf"
                        ? {
                            ...o,
                            default: m.config.defaultOption === o.identifier,
                          }
                        : o
                    )
                  ),
                },
              }))
            ),
          },
        },
      })
    },

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
