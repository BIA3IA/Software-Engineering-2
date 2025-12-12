import React from "react"
import { StyleSheet } from "react-native"
import { Button } from "react-native-paper"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { radius } from "@/theme/layout"

type Variant = "primary" | "secondary" | "outline" | "destructive"

interface AppButtonProps {
  title: string
  variant?: Variant
  onPress?: () => void
  textColor?: string
  borderColor?: string
}

export function AppButton({
  title,
  variant = "primary",
  onPress,
  textColor,
  borderColor,
}: AppButtonProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const primaryBg = palette.buttonPrimaryBg
  const primaryText = palette.buttonPrimaryText

  const secondaryBg = palette.buttonSecondaryBg
  const secondaryText = palette.buttonSecondaryText
  const secondaryBorder = palette.buttonSecondaryBorder

  const outlineBorder = palette.buttonOutlineBorder
  const outlineText = palette.buttonOutlineText

  const destructiveBg = palette.buttonDestructiveBg
  const destructiveText = palette.buttonDestructiveText

  const isPrimary = variant === "primary"
  const isSecondary = variant === "secondary"
  const isOutline = variant === "outline"
  const isDestructive = variant === "destructive"

  const buttonColor = isPrimary
    ? primaryBg
    : isSecondary
      ? secondaryBg
      : isDestructive
        ? destructiveBg
        : "transparent"
  const computedTextColor = isPrimary
    ? primaryText
    : isSecondary
      ? secondaryText
      : isDestructive
        ? destructiveText
        : outlineText
  const resolvedTextColor = textColor ?? computedTextColor
  const computedBorderColor = isSecondary ? secondaryBorder : isOutline ? outlineBorder : undefined
  const resolvedBorderColor = borderColor ?? computedBorderColor
  const mode = isOutline ? "outlined" : "contained"

  return (
    <Button
      mode={mode}
      onPress={onPress}
      buttonColor={buttonColor as any}
      textColor={resolvedTextColor as any}
      style={[
        styles.button,
        { borderColor: resolvedBorderColor, borderWidth: resolvedBorderColor ? 1 : 0 },
      ]}
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
