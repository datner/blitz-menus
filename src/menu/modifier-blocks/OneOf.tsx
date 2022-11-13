import { Radio } from "@mantine/core"
import { OneOf, OneOfOption } from "db/itemModifierConfig"
import { ReactNode } from "react"
import { flow, pipe, apply } from "fp-ts/function"
import { getDescription, getLabel } from "./helpers"
import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "db"
import { map } from "fp-ts/Array"
import { useController } from "react-hook-form"
import { ItemForm } from "../validations/item"

import * as L from "monocle-ts/Lens"
import { toShekel } from "src/core/helpers/content"

type Props = {
  modifier: OneOf
}

const radio = (locale: Locale) =>
  map<OneOfOption, ReactNode>((o) => (
    <Radio
      key={o.identifier}
      value={o.identifier}
      classNames={{
        label: "flex grow h-11 items-center",
        labelWrapper: "flex grow",
        body: "items-center",
        inner: "pt-1.5",
        icon: "mt-[3px]",
      }}
      label={
        <>
          <span className="grow">{getLabel(o)(locale)}</span>
          <span className="text-sm text-emerald-600 px-4">
            {o.price > 0 ? `+ ${toShekel(o.price)}` : ""}
          </span>
        </>
      }
    />
  ))

const oneOfUs = pipe(L.id<ItemForm["modifiers"]["oneOf"][string]>(), L.prop("choice"))

export const OneOfComponent = (props: Props) => {
  const { modifier } = props
  const { field } = useController<ItemForm, `modifiers.oneOf.${string}`>({
    name: `modifiers.oneOf.${modifier.identifier}`,
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
