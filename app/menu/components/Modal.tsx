import { XIcon } from "@heroicons/react/solid"
import { useTransition, config, a } from "@react-spring/web"
import { PropsWithChildren } from "react"

type Props = PropsWithChildren<{
  readonly open?: boolean
  onClose(): void
}>

export function Modal(props: Props) {
  const { open, onClose, children } = props

  const transition = useTransition(open, {
    from: { y: 200, opacity: 0 },
    enter: { y: 0, opacity: 1 },
    leave: { y: 200, opacity: 0 },
    config: config.stiff,
    reverse: open,
  })

  return transition(
    (styles, show) =>
      show && (
        <div className="fixed z-50 inset-0">
          <a.div
            style={{ opacity: styles.opacity }}
            className="absolute inset-0 max-h-screen bg-gray-500/75"
          />
          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          <a.div style={styles} className="absolute flex flex-col justify-end inset-0 -bottom-12">
            <div onClick={onClose} className="h-12 flex-shrink-0" />
            <div className="bg-white flex flex-col relative rounded-t-xl max-h-[calc(100%_-_48px)] pb-12">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 h-10 w-10 p-1.5 text-gray-700 rounded-full bg-gray-400/50"
              >
                <XIcon />
              </button>
              {children}
            </div>
          </a.div>
        </div>
      )
  )
}
