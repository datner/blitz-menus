import { SessionContext, Ctx } from "blitz"

export type ExistsQueryResponse = [{ exists: boolean }]

export interface OwnershipValidator {
  (id: number | undefined, session: SessionContext): Promise<void>
}

interface ResolverValidateOwnership {
  <T>(validator: OwnershipValidator): (input: T, ctx: Ctx) => Promise<T>
}

export const validateOwnership: ResolverValidateOwnership = (validator) => {
  return async function _innerValidateOwnership(input, ctx) {
    await validator((input as any).id, ctx.session)
    return input
  }
}
