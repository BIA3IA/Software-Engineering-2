import React from "react"
import { StyleSheet } from "react-native"
import { Button } from "react-native-paper"
import { useAppTheme } from "@/theme/paperTheme"
import { radius } from "@/theme/layout"

type Variant = "primary" | "secondary" | "outline"

interface AppButtonProps {
  title: string
  variant?: Variant
  onPress?: () => void
}

export function AppButton({ title, variant = "primary", onPress }: AppButtonProps) {
  const { colors } = useAppTheme()

  const primaryBg = colors.buttonPrimaryBg
  const primaryText = colors.buttonPrimaryText

  const secondaryBg = colors.buttonSecondaryBg
  const secondaryText = colors.buttonSecondaryText
  const secondaryBorder = colors.buttonSecondaryBorder

  const outlineBorder = colors.buttonOutlineBorder
  const outlineText = colors.buttonOutlineText

  const isPrimary = variant === "primary"
  const isSecondary = variant === "secondary"
  const isOutline = variant === "outline"

  const buttonColor = isPrimary ? primaryBg : isSecondary ? secondaryBg : "transparent"
  const textColor = isPrimary ? primaryText : isSecondary ? secondaryText : outlineText
  const borderColor = isSecondary ? secondaryBorder : isOutline ? outlineBorder : undefined
  const mode = isOutline ? "outlined" : "contained"

  return (
    <Button
      mode={mode}
      onPress={onPress}
      buttonColor={buttonColor as any}
      textColor={textColor as any}
      style={[styles.button, { borderColor, borderWidth: borderColor ? 1 : 0 }]}
      labelStyle={styles.label}
      contentStyle={{ height: 50 }}
    >
      {title}
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.pill,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
})
