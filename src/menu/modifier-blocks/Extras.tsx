import { Checkbox } from "@mantine/core"
import { ExtrasOption, Extras } from "db/itemModifierConfig"
import { ReactNode } from "react"
import { getDescription, getLabel } from "./helpers"
import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "db"
import { SmallAmountButtons } from "src/menu/components/SmallAmountButton"
import { max } from "src/core/helpers/number"
import { useController } from "react-hook-form"
import { ItemForm } from "../validations/item"
import { isSome, matchW, some, chain, none } from "fp-ts/Option"
import { MonoidSum } from "fp-ts/number"
import { apply, constFalse, identity, pipe } from "fp-ts/function"
import { Ord as ordS } from "fp-ts/string"
import { last } from "fp-ts/Semigroup"
import { map } from "fp-ts/Array"
import * as A from "fp-ts/Array"
import * as O from "fp-ts/Option"
import * as RA from "fp-ts/ReadonlyArray"
import * as RR from "fp-ts/ReadonlyRecord"
import * as L from "monocle-ts/Lens"
import { useTranslations } from "next-intl"
import { toShekel } from "src/core/helpers/content"

type Props = {
  modifier: Extras
}

const checkbox =
  (locale: Locale) =>
  (
    value: ItemForm["modifiers"]["extras"][string],
    onChange: (choice: string) => (n: number) => void,
    modifier: Extras
  ) =>
    pipe(
      pipe(
        modifier.max,
        matchW(constFalse, (m) =>
          pipe(value.choices, RR.foldMap(ordS)(MonoidSum)(identity), (amount) => amount >= m)
        )
      ),
      (overMax) =>
        pipe(
          modifier.options,
          map<ExtrasOption, ReactNode>((o) => (
            <Checkbox
              key={o.identifier}
              disabled={value.choices[o.identifier]! > 0 ? false : overMax}
              value={o.identifier}
              classNames={{
                label: "flex grow h-11 items-center",
                labelWrapper: "flex grow",
                body: "items-center",
              }}
              label={
                <>
                  <div className="grow flex flex-col">
                    <span>{getLabel(o)(locale)}</span>
                    <span className="text-sm text-emerald-600">
                      {o.price > 0 ? `+ ${toShekel(o.price)}` : ""}
                    </span>
                  </div>
                  {pipe(
                    value.choices,
                    RR.lookup(o.identifier),
                    O.chain((a) => (a > 0 ? some(a) : none)),
                    chain(o.multi ? some : () => none),
                    matchW(
                      () => null,
                      (n) => (
                        <span onClick={(e) => e.preventDefault()}>
                          <SmallAmountButtons
                            value={n}
                            onChange={onChange(o.identifier)}
                            disabled={overMax}
                          />
                        </span>
                      )
                    )
                  )}
                </>
              }
            />
          ))
        )
    )

const lensAmount = (choice: string) =>
  pipe(
    L.id<ItemForm["modifiers"]["extras"][string]>(),
    L.prop("choices"),
    L.prop(choice),
    L.asOptional
  )

export const ExtrasComponent = (props: Props) => {
  const { modifier } = props
  const locale = useLocale()
  const t = useTranslations("menu.Components.Extras")
  const { field, fieldState } = useController<ItemForm, `modifiers.extras.${string}`>({
    name: `modifiers.extras.${modifier.identifier}`,
  })

  const handleAmountChange = (choice: string) => (amount: number) => {
    const next = pipe(lensAmount(choice).set(amount), apply(field.value))
    field.onChange(next)
    // validate(next.choices)
  }

  const handleChange = (choices: string[]) => {
    const getValue = (choice: string) =>
      pipe(
        choices,
        A.findFirst((c) => c === choice),
        O.chainNullableK((c) => field.value.choices[c]),
        O.map((prev) => max(1)(prev)),
        O.getOrElse(() => 0)
      )

    const refs = pipe(
      modifier.options,
      A.map((o) => o.identifier)
    )

    const nextChoices = RR.fromFoldableMap(last<number>(), RA.Foldable)(refs, (r) => [
      r,
      getValue(r),
    ])

    field.onChange({
      identifier: modifier.identifier,
      choices: nextChoices,
    })
  }

  const value = pipe(
    field.value.choices,
    RR.filter((c) => c > 0),
    RR.keys,
    RA.toArray
  )

  return (
    <Checkbox.Group
      {...field}
      tabIndex={-1}
      orientation="vertical"
      offset="lg"
      size="lg"
      error={fieldState.error ? t("error") : null}
      label={getLabel(modifier)(locale)}
      withAsterisk={isSome(modifier.min)}
      onChange={handleChange}
      value={value}
      description={
        <>
          <span>{getDescription(modifier)(locale)}</span>
          <br />
          {pipe(
            modifier.min,
            matchW(
              () => null,
              (min: number) => <span className="ltr:mr-2 rtl:ml-2">{t("min", { min })}</span>
            )
          )}
          {pipe(
            modifier.max,
            matchW(
              () => null,
              (max: number) => <span>{t("max", { max })}</span>
            )
          )}
        </>
      }
    >
      {checkbox(locale)(field.value, handleAmountChange, modifier)}
    </Checkbox.Group>
  )
}
ExtrasComponent.displayName = "Extras"