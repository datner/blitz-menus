import { Radio } from "@mantine/core"
import { OneOf, OneOfOption } from "db/itemModifierConfig"
import { ReactNode } from "react"
import { flow, pipe, apply } from "fp-ts/function"
import { getDescription, getLabel } from "./helpers"
import { useLocale } from "app/core/hooks/useLocale"
import { Locale } from "db"
import { map } from "fp-ts/Array"
import { useController } from "react-hook-form"
import { ItemForm } from "../validations/item"

import * as L from "monocle-ts/Lens"

type Props = {
  modifier: OneOf
}

const radio = (locale: Locale) =>
  map<OneOfOption, ReactNode>((o) => (
    <Radio key={o.ref} value={o.ref} label={getLabel(o)(locale)} />
  ))

const oneOfUs = pipe(L.id<ItemForm["modifiers"]["oneOf"][string]>(), L.prop("choice"))

export const OneOfComponent = (props: Props) => {
  const { modifier } = props
  const { field } = useController<ItemForm, `modifiers.oneOf.${string}`>({
    name: `modifiers.oneOf.${modifier.ref}`,
  })
  const locale = useLocale()
  return (
    <Radio.Group
      orientation="vertical"
      offset="lg"
      size="lg"
      {...field}
      value={field.value.choice}
      onChange={flow(oneOfUs.set, apply(field.value), field.onChange)}
      label={getLabel(modifier)(locale)}
      description={getDescription(modifier)(locale)}
    >
      {radio(locale)(modifier.options)}
    </Radio.Group>
  )
}
OneOfComponent.displayName = "OneOf"
