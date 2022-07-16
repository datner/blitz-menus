import { NotFoundError, resolver } from "blitz"
import db from "db"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { UpdateItem } from "../validations"

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  (input) => input, // fixes a weird typebug 🤔
  async (input) => {
    const item = await db.item.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      select: { image: true, blurDataUrl: true },
    })
    if (!item) throw new NotFoundError()

    if (item.image === input.image) return input

    return { ...input, dataBlurUrl: await getBlurDataUrl(input.image) }
  },
  ({ organizationId, id, ...data }) =>
    db.item.update({
      where: { id },
      include: { content: true },
      data,
    })
)
