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
  interface ProcessEnvVars {
    readonly NODE_ENV: "development" | "production" | "test"
    readonly DATABASE_URL: string
    readonly IMGIX_API_KEY: string
    readonly IMGIX_SOURCE_ID: string
    readonly DORIX_API_URL: string
    readonly DORIX_API_KEY: string
    readonly TELEGRAM_BOT_TOKEN: string
    readonly TELEGRAM_CHAT_ID: string
    readonly CREDIT_GUARD_API_URL: string
  }
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnvVars {}
  }
}
