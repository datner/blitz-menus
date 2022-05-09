import { useParams, useRouter } from "blitz"
import type * as z from "zod"

export const useZodParams = <Zod extends z.ZodSchema>(schema: Zod) =>
  schema.parse(useParams()) as z.infer<typeof schema>