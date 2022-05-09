import { useCallback, useLayoutEffect, useRef } from "react"

export function useEvent<T extends (...args: any) => any>(handler: T): T {
  const handlerRef = useRef<T>(handler)

  useLayoutEffect(() => {
    handlerRef.current = handler
  })

  return useCallback((...args: Parameters<T>) => {
    const fn = handlerRef.current
    return fn(...args)
  }, []) as T
}
