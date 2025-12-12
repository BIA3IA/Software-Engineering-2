import React from "react"

type BottomNavVisibilityValue = {
  setHidden: (hidden: boolean) => void
}

export const BottomNavVisibilityContext = React.createContext<BottomNavVisibilityValue | undefined>(undefined)

export function useBottomNavVisibility() {
  const ctx = React.useContext(BottomNavVisibilityContext)
  if (!ctx) {
    throw new Error("useBottomNavVisibility must be used within BottomNavVisibilityContext.Provider")
  }
  return ctx
}
