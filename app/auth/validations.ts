import { z } from "zod"

export const email = z
  .string()
  .email()
  .transform((str) => str.toLowerCase().trim())

export const password = z
  .string()
  .min(10)
  .max(100)
  .transform((str) => str.trim())

export const Signup = z.object({
  email,
  password,
})

export const Login = z.object({
  email,
  password: z.string().nonempty(),
})

export const ForgotPassword = z.object({
  email,
})

export const ResetPassword = z
  .object({
    password: password,
    passwordConfirmation: password,
    token: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords don't match",
    path: ["passwordConfirmation"], // set the path of the error
  })

export const ChangePassword = z.object({
  currentPassword: z.string(),
  newPassword: password,
})

const RestaurantContent = z.object({
  name: z
    .string()
    .nonempty()
    .transform((str) => str.trim()),
})

export const Slug = z
  .string()
  .nonempty()
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug should contain only lowercase letters, numbers, and dashes",
  })
  .regex(/[^-]$/, {
    message: "Slug should not end with a dash",
  })

export const CreateRestaurant = z.object({
  slug: Slug,
  logo: z.string().nonempty(),
  en: RestaurantContent,
  he: RestaurantContent,
})
