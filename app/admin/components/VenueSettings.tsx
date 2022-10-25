import { Button, Container, Loader, Paper, TextInput } from "@mantine/core"
import { useZodForm } from "app/core/hooks/useZodForm"
import { useTranslations } from "next-intl"
import { Settings } from "app/admin/validations/settings"
import { useMutation } from "@blitzjs/rpc"
import updateAddress from "app/admin/mutations/updateAddress"
import { useAuthenticatedSession } from "@blitzjs/auth"

export function VenueSettings() {
  const t = useTranslations("admin.Components.VenueSettings")
  const form = useZodForm({
    schema: Settings,
  })
  const [updateSettings] = useMutation(updateAddress)

  const handleSubmit = form.handleSubmit(async (data) => {
    await updateSettings(data)
  })
  console.log(useAuthenticatedSession())

  return (
    <Container p="lg">
      <Paper
        component="form"
        withBorder
        shadow="md"
        p={30}
        mt={30}
        radius="md"
        onSubmit={handleSubmit}
      >
        <fieldset disabled={form.formState.isSubmitting}>
          <TextInput {...form.register("address")} label={t("address")} />
          <TextInput {...form.register("phone")} label={t("phone number")} />
        </fieldset>
        <Button mt={16} type="submit">
          {form.formState.isSubmitting ? <Loader /> : t("update")}
        </Button>
      </Paper>
    </Container>
  )
}
