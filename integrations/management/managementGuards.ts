import { ManagementIntegration, ManagementProvider } from "@prisma/client"
import { ManagementMismatchError } from "./managementErrors"
import * as E from "fp-ts/Either"

export const ensureManagementMatch =
  (provider: ManagementProvider) =>
  (integration: ManagementIntegration): E.Either<ManagementMismatchError, ManagementIntegration> =>
    integration.provider === provider
      ? E.right(integration)
      : E.left<ManagementMismatchError>({
          tag: "ManagementMismatchError",
          given: integration.provider,
          needed: provider,
        })
