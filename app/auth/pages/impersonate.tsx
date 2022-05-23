import LabeledTextField from "app/core/components/LabeledTextField"
import { useZodForm } from "app/core/hooks/useZodForm"
import { queryClient, Routes, useMutation, useRouter } from "blitz"
import { FormProvider } from "react-hook-form"
import { z } from "zod"
import impersonateUser from "../mutations/impersonateUser"

const ImpersonateUserForm = () => {
  const [impersonateUserMutation] = useMutation(impersonateUser)
  const form = useZodForm({ schema: z.object({ userId: z.number() }) })
  const router = useRouter()
  const { handleSubmit, setFormError, formState } = form
  const { isSubmitting } = formState

  const onSubmit = handleSubmit(async (data) => {
    try {
      await impersonateUserMutation(data)
      queryClient.clear()
      router.push(Routes.AdminHome())
    } catch (error: any) {
      setFormError("Sorry, we had an unexpected error. Please try again. - " + error.toString())
    }
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit}>
        <LabeledTextField
          name="userId"
          title="User Id"
          registerOptions={{ valueAsNumber: true }}
          label="User ID"
        />
        <button
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          type="submit"
          disabled={isSubmitting}
        >
          Impersonate
        </button>
      </form>
    </FormProvider>
  )
}

export default ImpersonateUserForm
