import { MD3LightTheme, MD3DarkTheme, useTheme, type MD3Colors, type MD3Theme } from "react-native-paper"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"

export type AppTheme = MD3Theme & { colors: MD3Colors }

export const useAppTheme = () => useTheme<AppTheme>()

export function usePaperTheme(): MD3Theme {
  const scheme: "light" | "dark" = (useColorScheme() as "light" | "dark") ?? "light"
  const palette = Colors[scheme]
  const base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme

  return {
    ...base,
    roundness: 24,
    colors: {
      ...base.colors,
      ...palette,
    },
  }
}
