import { ExclamationCircleIcon } from "@heroicons/react/solid"
import { ComponentPropsWithoutRef, forwardRef, memo } from "react"
import { FieldError } from "react-hook-form"
import { TextAreaBase, TextAreaProps } from "./TextAreaBase"

export interface LabeledTextAreaProps extends TextAreaProps {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  /** Field type. Doesn't include radio buttons and checkboxes */
  type?: "text" | "password" | "email" | "number"
  outerProps?: ComponentPropsWithoutRef<"div">
  labelProps?: ComponentPropsWithoutRef<"label">
  error?: FieldError
  errorId?: string
}

export const LabeledTextArea = memo(
  forwardRef<HTMLTextAreaElement, LabeledTextAreaProps>(
    ({ label, error, errorId, outerProps, labelProps, name, ...props }, ref) => {
      return (
        <div {...outerProps}>
          <label {...labelProps}>
            <span className="block text-sm font-medium text-gray-700">{label}</span>
            <div className="mt-1 relative">
              <TextAreaBase
                ref={ref}
                name={name}
                {...props}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
              {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
          </label>

          {error && (
            <p id={errorId} className="mt-2 text-sm text-red-600">
              {error.message}
            </p>
          )}
        </div>
      )
    }
  )
)

export default LabeledTextArea
