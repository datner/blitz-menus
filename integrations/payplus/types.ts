import { getAmount } from "integrations/helpers"
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
    more_info_1: z.string().optional(),
    more_info_2: z.string().optional(),
    more_info_3: z.string().optional(),
    more_info_4: z.string().optional(),
    more_info_5: z.string().optional(),
    refURL_success: z.string().optional(),
    refURL_failure: z.string().optional(),
    refURL_callback: z.string().optional(),
    customer: z
      .object({
        customer_name: z.string(),
        email: z.string(),
        phone: z.string(),
        vat_number: z.number(),
      })
      .default({ vat_number: 0, customer_name: "", phone: "", email: "" }),
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
  api_key: z.string(),
  secret_key: z.string(),
})

export type Authorization = z.infer<typeof Authorization>

export type InvoiceStatusError = {
  tag: "invoiceStatusError"
  docUrl: string
}
