import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "src/core/layouts/Layout"
import { FORM_ERROR } from "src/core/components/Form"
import { ResetPassword } from "src/auth/validations"
import resetPassword from "src/auth/mutations/resetPassword"
import { useZodForm } from "src/core/hooks/useZodForm"
import { Button, PasswordInput } from "@mantine/core"
import { useEffect } from "react"

const ResetPasswordPage: BlitzPage = () => {
  const query = useRouter().query
  const [resetPasswordMutation, { isSuccess }] = useMutation(resetPassword)
  const form = useZodForm({
    schema: ResetPassword,
  })
  const { register } = form

  useEffect(() => {
    register("token", { value: query.token as string })
  })

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        await resetPasswordMutation(values)
      } catch (error: any) {
        if (error.name === "ResetPasswordError") {
          return {
            [FORM_ERROR]: error.message,
          }
        } else {
          return {
            [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again.",
          }
        }
      }
    },
    (a) => console.log(a)
  )

  return (
    <div>
      <h1>Set a New Password</h1>

      {isSuccess ? (
        <div>
          <h2>Password Reset Successfully</h2>
          <p>
            Go to the <Link href={Routes.Authentication()}>homepage</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <PasswordInput label="New Password" {...register("password")} />
          <PasswordInput
            {...register("passwordConfirmation")}
            name="passwordConfirmation"
            label="Confirm New Password"
          />
          <Button type="submit">Submit</Button>
        </form>
      )}
    </div>
  )
}

ResetPasswordPage.redirectAuthenticatedTo = "/"
ResetPasswordPage.getLayout = (page) => <Layout title="Reset Your Password">{page}</Layout>

export default ResetPasswordPage
