import { useColorScheme as useDeviceColorScheme } from "react-native"
import { create } from "zustand"

export type AppearancePreference = "light" | "dark" | "system"

type ThemePreferenceState = {
  preference: AppearancePreference
  setPreference: (preference: AppearancePreference) => void
}

const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: "system",
  setPreference: (preference) => set({ preference }),
}))

export function useThemePreference() {
  return useThemePreferenceStore((state) => state.preference)
}

export function useSetThemePreference() {
  return useThemePreferenceStore((state) => state.setPreference)
}

export function useColorScheme() {
  const systemScheme = useDeviceColorScheme()
  const preference = useThemePreference()
  return preference === "system" ? systemScheme : preference
}
