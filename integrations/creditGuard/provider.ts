import { ClearingProvider } from "integrations/clearingProvider"
import { getLink } from "./getLink"
import { validateTransaction } from "./validateTransaction"

export const creditGuardProvider: ClearingProvider = {
  getLink,
  validateTransaction,
}

export default creditGuardProvider
