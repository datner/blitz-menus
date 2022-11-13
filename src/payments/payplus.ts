import { parseISO } from "date-fns/fp"
import { z } from "zod"

export const PayPlusCallback = z.object({
  transaction_type: z.enum(["Charge", "Refund"]),
  transaction: z.object({
    uid: z.string(),
    payment_request_uid: z.string().optional(),
    number: z.string(),
    type: z.string(),
    date: z.string().transform(parseISO),
    status_code: z.string(),
    amount: z.number(),
    currency: z.literal("ILS"),
    credit_terms: z.string(),
    payments: z.object({
      number_of_payments: z.number(),
      first_payment_amount: z.number(),
      rest_payments_amount: z.number(),
    }),
    secure3D: z.object({
      status: z.boolean(),
      tracking: z.null(), // no idea what this should be
    }),
    approval_number: z.string(), // not actually a number, can start with 0
    voucher_number: z.string(), // again not number, a code XX-XXX-XX
    more_info: z.string(),
    more_info_1: z.string(),
    more_info_2: z.string(),
    more_info_3: z.string(),
    more_info_4: z.string(),
    more_info_5: z.string(),
    recurring_charge_information: z.object({
      recurring_uid: z.string(),
      charge_uid: z.string(),
    }),
  }),
  data: z.object({
    customer_uid: z.string(),
    terminal_uid: z.string(),
    cashier_uid: z.string(),
    items: z
      .object({
        amount_pay: z.number(),
        discount_amount: z.number(),
        discount_type: z.null(), // todo: figure this one out
        discount_value: z.number(),
        quantity: z.number(),
        quantity_price: z.number(),
        product_uid: z.string().nullish(), // presented as uuid, I suspect that this will be null / "" instead for undefined products
        name: z.string(),
      })
      .array(),
    card_information: z.object({
      card_holder_name: z.string(),
      four_digits: z.string(), // "1792"
      expiry_month: z.string(), // "01"
      expiry_year: z.string(), // 26
      clearing_id: z.number(),
      brand_id: z.number(),
      issuer_id: z.number(),
      card_foreign: z.number(),
      card_bin: z.string(),
    }),
  }),
  invoice: z.object({
    uuid: z.string(),
    docu_number: z.string(),
    original_url: z.string().url(),
    copy_url: z.string().url(),
    integrator_name: z.string(),
    status: z.string(), // can be Success or................. what?
  }),
})

export type PayPlusCallback = z.infer<typeof PayPlusCallback>
