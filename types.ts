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
      roles: Role[]
      orgId?: Organization["id"]
      restaurantId?: Restaurant["id"]
      impersonatingFromUserId?: User["id"]
    }
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string
      IMGIX_API_KEY: string
      IMGIX_SOURCE_ID: string
      DORIX_API_URL: string
      DORIX_API_KEY: string
      TELEGRAM_BOT_TOKEN: string
      TELEGRAM_CHAT_ID: string
      CREDIT_GUARD_API_URL: string
    }
  }
}
