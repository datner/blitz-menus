import { resolver } from "@blitzjs/rpc"
import db from "db"
import * as A from "fp-ts/Array"
import { pipe, tuple } from "fp-ts/function"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { UpdateItem } from "../validations"
import { NotFoundError } from "blitz"
import { setDefaultVenue } from "app/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "app/core/helpers/revalidation"

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  setDefaultVenue,
  enforceSuperAdminIfNotCurrentOrganization,
  async (input) => {
    const item = await db.item.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      select: { image: true, blurDataUrl: true },
    })
    if (!item) throw new NotFoundError()

    if (item.image === input.image) return input

    return { ...input, blurDataUrl: await getBlurDataUrl(input.image) }
  },
  async ({ organizationId, venue, id, modifiers, ...data }) => {
    const modifiersWithPosition = pipe(modifiers, A.mapWithIndex(tuple))
    const item = await db.item.update({
      where: { id },
      include: { content: true, modifiers: true },
      data: {
        ...data,
        modifiers: {
          update: pipe(
            modifiersWithPosition,
            A.filter(([, m]) => m.modifierId != null),
            A.map(([p, { config, modifierId }]) => ({
              where: { id: modifierId! },
              data: {
                position: p,
                config: {
                  ...config,
                  content: [
                    { locale: "en", ...config.content.en },
                    { locale: "he", ...config.content.he },
                  ],
                  options: pipe(
                    config.options,
                    A.mapWithIndex((i, o) => ({
                      ...o,
                      position: i,
                      content: [
                        { locale: "en", ...o.content.en },
                        { locale: "he", ...o.content.he },
                      ],
                    })),
                    A.map((o) =>
                      config._tag === "oneOf"
                        ? {
                            ...o,
                            default: config.defaultOption === String(p),
                          }
                        : o
                    )
                  ),
                },
              },
            }))
          ),
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
    await revalidateVenue(venue.identifier)()
    return item
  }
)
