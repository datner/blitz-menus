import { useRef, useState } from "react"
import { Nullish, Unarray } from "../types/utils"

interface NavigationRefs {
  container: HTMLDivElement | null
  sections: HTMLDivElement[]
  buttons: HTMLButtonElement[]
}

interface UseNavBarProps {
  initialActive?: string
}

const STICKY_BAR_HEIGHT = 52

export function useNavBar(props: UseNavBarProps) {
  const { initialActive } = props
  const refs = useRef<NavigationRefs>({
    container: null,
    buttons: [],
    sections: [],
  })

  const [section, set] = useState(initialActive)

  const setRef =
    <T extends "buttons" | "sections">(ref: T) =>
    (index: number) =>
    (el: Unarray<NavigationRefs[T]>) => {
      if (!el) return
      refs.current
      refs.current[ref][index] = el
    }

  const onScroll = () => {
    const nextSection = refs.current.sections.findIndex(
      (it) => it.getBoundingClientRect().top > STICKY_BAR_HEIGHT
    )
    const activeIndex =
      nextSection === -1 ? refs.current.sections.length - 1 : Math.max(nextSection, 1) - 1
    const activeSection = refs.current.sections[activeIndex]
    const activeButton = refs.current.buttons[activeIndex]
    if (activeSection && section !== activeSection.id) {
      set(activeSection.id)
      activeButton?.scrollIntoView({ inline: "start", behavior: "smooth" })
    }
  }

  const onClick = (index: number) => () => {
    const el = refs.current.sections[index]
    if (!refs.current.container || !el) return

    const top = el.offsetTop - STICKY_BAR_HEIGHT
    refs.current.container.scroll({ top, behavior: "smooth" })
  }

  return {
    sectionRef: setRef("sections"),
    buttonRef: setRef("buttons"),
    containerRef: (el: HTMLDivElement) => (refs.current.container = el),
    onScroll,
    onClick,
    section,
  }
}
