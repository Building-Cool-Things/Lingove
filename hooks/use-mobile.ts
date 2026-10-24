import * as React from "react"

const MOBILE_BREAKPOINT = 1024 // the app's dk breakpoint: below it the bottom tab bar is used
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useIsMobile() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
