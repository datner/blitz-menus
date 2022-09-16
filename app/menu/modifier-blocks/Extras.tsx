import { Checkbox } from "@mantine/core"
import { ExtrasOption, Extras } from "db/itemModifierConfig"
import { ReactNode } from "react"
import { getDescription, getLabel } from "./helpers"
import { useLocale } from "app/core/hooks/useLocale"
import { Locale } from "db"
import { SmallAmountButtons } from "app/menu/components/SmallAmountButton"
import { max } from "app/core/helpers/number"
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
              key={o.ref}
              disabled={value.choices[o.ref]! > 0 ? false : overMax}
              value={o.ref}
              label={
                <>
                  <span className="grow">{getLabel(o)(locale)}</span>
                  {pipe(
                    value.choices,
                    RR.lookup(o.ref),
                    O.chain((a) => (a > 0 ? some(a) : none)),
                    chain(o.multi ? some : () => none),
                    matchW(
                      () => null,
                      (n) => (
                        <span>
                          <SmallAmountButtons
                            value={n}
                            onChange={onChange(o.ref)}
                            disabled={overMax}
                          />
                        </span>
                      )
                    )
                  )}
                </>
              }
              classNames={{ label: "flex grow h-11 items-center" }}
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
  const { field, fieldState } = useController<ItemForm, `modifiers.extras.${string}`>({
    name: `modifiers.extras.${modifier.ref}`,
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
      A.map((o) => o.ref)
    )

    const nextChoices = RR.fromFoldableMap(last<number>(), RA.Foldable)(refs, (r) => [
      r,
      getValue(r),
    ])

    field.onChange({
      ref: modifier.ref,
      choices: nextChoices,
    })
  }

  return (
    <Checkbox.Group
      orientation="vertical"
      offset="lg"
      size="lg"
      error={fieldState.error?.message}
      label={getLabel(modifier)(locale)}
      withAsterisk={isSome(modifier.min)}
      onChange={handleChange}
      value={pipe(
        field.value.choices,
        RR.filter((c) => c > 0),
        RR.keys,
        RA.toArray
      )}
      description={
        <>
          <span>{getDescription(modifier)(locale)}</span>
          <br />
          {matchW(
            () => null,
            (num: number) => <span className="mr-2">min: {num}</span>
          )(modifier.min)}
          {matchW(
            () => null,
            (num: number) => <span>max: {num}</span>
          )(modifier.max)}
        </>
      }
    >
      {checkbox(locale)(field.value, handleAmountChange, modifier)}
    </Checkbox.Group>
  )
}
ExtrasComponent.displayName = "Extras"
