import { OrderItem } from "db"
import * as TE from "fp-ts/TaskEither"
import * as A from "fp-ts/Array"
import { payPlusService } from "./client"
import { PaymentItem } from "./types"
import { divide } from "app/core/helpers/number"

export const toItems = A.map<OrderItem, PaymentItem>(({ price, quantity, name }) => ({
  price: divide(100)(price),
  quantity,
  name,
  vat_type: 0,
}))

export const service = TE.fromEither(payPlusService)
