import { DefaultCtx, SessionContext, SimpleRolesIsAuthorized } from "blitz"
import { User, GlobalRole, MembershipRole, Restaurant, Organization } from "db"

type Role = GlobalRole | MembershipRole

declare module "blitz" {
  export interface Ctx extends DefaultCtx {
    session: SessionContext
  }
  export interface Session {
    isAuthorized: SimpleRolesIsAuthorized<Role>
    PublicData: {
      userId: User["id"]
      role: Role
      roles: Role[]
      orgId?: Organization["id"]
      restaurantId?: Restaurant["id"]
      impersonatingFromUserId?: User["id"]
    }
  }
}
