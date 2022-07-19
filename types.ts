import { SessionContext, SimpleRolesIsAuthorized } from "@blitzjs/auth"
import { User, GlobalRole, MembershipRole, Restaurant, Organization } from "db"

type Role = GlobalRole | MembershipRole

declare module "@blitzjs/auth" {
  export interface Ctx {
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
