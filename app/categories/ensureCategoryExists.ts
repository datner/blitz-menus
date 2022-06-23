import { NotFoundError, SessionContext } from "blitz"
import db from "db"
import { ExistsQueryResponse, OwnershipValidator } from "app/auth/helpers/validateOwnership"

async function isCategoryExists(id: number | undefined, session: SessionContext) {
  const [{ exists }] =
    (await db.$queryRaw`SELECT EXISTS(SELECT 1 FROM "Category" WHERE "restaurantId" = ${session.restaurantId} AND id = ${id})`) as ExistsQueryResponse

  return exists
}

export const ensureCategoryExists: OwnershipValidator = async (id, session) => {
  if (!(await isCategoryExists(id, session))) {
    throw new NotFoundError(
      `Could not find category ${id} belonging to restaurant ${session.restaurantId}`
    )
  }
}
