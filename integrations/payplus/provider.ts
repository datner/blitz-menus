import { ClearingProvider } from "integrations/clearingProvider"
import { getLink } from "./getLink"
import { validateTransaction } from "./validateTransaction"

export const payPlusProvider: ClearingProvider = {
  getLink,
  validateTransaction,
}

export default payPlusProvider
