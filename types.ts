import { SessionContext, SimpleRolesIsAuthorized } from "@blitzjs/auth"
import { User, GlobalRole, MembershipRole, Restaurant, Organization, Venue } from "db"
import { Option } from "fp-ts/Option"

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
      venue: Option<Venue>
      orgId?: Organization["id"]
      organization: Option<Organization>
      restaurantId?: Restaurant["id"]
      impersonatingFromUserId: Option<number>
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
    readonly PAY_PLUS_API_KEY: string
    readonly PAY_PLUS_SECRET_KEY: string
    readonly PAY_PLUS_API_URL: string
    readonly REVALIDATION_SECRET_TOKEN: string
  }
  namespace NodeJS {
    interface ProcessEnv extends ProcessEnvVars {}
  }
}
