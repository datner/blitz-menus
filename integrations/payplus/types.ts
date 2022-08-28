import * as A from "fp-ts/Array"
import * as N from "fp-ts/number"
import { z } from "zod"

export const PaymentItem = z
  .object({
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })
  .transform((it) => ({ ...it, vat_type: 0 }))

export type PaymentItem = z.infer<typeof PaymentItem>

export const GeneratePaymentLinkBody = z
  .object({
    payment_page_uid: z.string().uuid(),
    more_info: z.string(),
    refURL_success: z.string(),
    refURL_failure: z.string(),
    refURL_callback: z.string(),
    customer: z.object({
      customer_name: z.string().default(""),
      email: z.string().email().default(""),
      phone: z.string().default(""),
      vat_number: z.string().default(""),
    }),
    items: PaymentItem.array(),
  })
  .transform((it) => ({
    ...it,
    amount: getAmount(it.items),
    expiry_datetime: "30",
    currency_code: "ILS",
    payments: 1,
    sendEmailApproval: Boolean(it.customer.email),
    sendEmailFailure: Boolean(it.customer.email),
  }))

export type GeneratePaymentLinkInput = z.input<typeof GeneratePaymentLinkBody>

type GetAmount = (items: z.infer<typeof PaymentItem>[]) => number
const getAmount: GetAmount = A.foldMap(N.MonoidSum)((it) => it.quantity * it.price)

const Status = z.enum(["success"])

const ResponseResults = z.object({
  status: Status,
  code: z.number(),
  description: z.string(),
})

export const GeneratePaymentLinkResponse = z.object({
  results: ResponseResults,
  data: z.object({
    page_request_uid: z.string().uuid(),
    payment_page_link: z.string().url(),
  }),
})
export type GeneratePaymentLinkResponse = z.infer<typeof GeneratePaymentLinkResponse>

const InvoiceType = z.enum(["Invoice Receipt", "Credit Invoice"])

export const Invoice = z.object({
  status: Status,
  type: InvoiceType,
  date: z.string(),
  original_doc_url: z.string().url(),
  copy_doc_url: z.string().url(),
})

export type Invoice = z.infer<typeof Invoice>

export const GetStatusResponse = z.object({
  invoices: Invoice.array(),
})

export type GetStatusResponse = z.infer<typeof GetStatusResponse>

export const Authorization = z.object({
  api_key: z.string().url(),
  secret_key: z.string().url(),
})

export type Authorization = z.infer<typeof Authorization>

export type InvoiceStatusError = {
  tag: "invoiceStatusError"
  docUrl: string
}
