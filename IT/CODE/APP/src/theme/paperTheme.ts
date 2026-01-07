import { MD3LightTheme, MD3DarkTheme, useTheme, type MD3Theme } from "react-native-paper"
import { useColorScheme } from "@/hooks/useColorScheme"

export type AppTheme = MD3Theme

export const useAppTheme = () => useTheme<AppTheme>()

export function usePaperTheme(): MD3Theme {
  const scheme: "light" | "dark" = (useColorScheme() as "light" | "dark") ?? "light"
  const base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme

  return {
    ...base,
    roundness: 24,
    colors: {
      ...base.colors,
    },
  }
}
