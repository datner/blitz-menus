import Link from "next/link"
import { useMutation } from "@blitzjs/rpc"
import { useRouter } from "next/router"
import { BlitzPage, Routes } from "@blitzjs/next"
import Layout from "app/core/layouts/Layout"
import { LabeledTextField } from "app/core/components/LabeledTextField"
import { Form, FORM_ERROR } from "app/core/components/Form"
import { ResetPassword } from "app/auth/validations"
import resetPassword from "app/auth/mutations/resetPassword"
import { useZodForm } from "app/core/hooks/useZodForm"
import { Button, PasswordInput, TextInput } from "@mantine/core"

const ResetPasswordPage: BlitzPage = () => {
  const query = useRouter().query
  const [resetPasswordMutation, { isSuccess }] = useMutation(resetPassword)
  const form = useZodForm({
    schema: ResetPassword,
    defaultValues: { token: query.token as string },
  })

  const onSubmit = form.handleSubmit(
    async (values) => {
      console.log("hmm?")
      try {
        console.log(values)
        await resetPasswordMutation(values)
      } catch (error: any) {
        console.log(error)
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
          <input {...form.register("token", { value: query.token as string })} />
          <PasswordInput label="New Password" {...form.register("password")} />
          <PasswordInput
            {...form.register("passwordConfirmation")}
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
