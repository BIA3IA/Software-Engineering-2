import React from "react"
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native"
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
  buttonColor?: string
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
}

export function AppButton({
  title,
  variant = "primary",
  onPress,
  textColor,
  borderColor,
  buttonColor,
  style,
  contentStyle,
}: AppButtonProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const primaryBg = palette.button.primary.bg
  const primaryText = palette.button.primary.text

  const secondaryBg = palette.button.secondary.bg
  const secondaryText = palette.button.secondary.text
  const secondaryBorder = palette.button.secondary.border

  const outlineBorder = palette.button.outline.border
  const outlineText = palette.button.outline.text

  const destructiveBg = palette.button.danger.bg
  const destructiveText = palette.button.danger.text

  const isPrimary = variant === "primary"
  const isSecondary = variant === "secondary"
  const isOutline = variant === "outline"
  const isDestructive = variant === "destructive"

  const defaultButtonColor = isPrimary
    ? primaryBg
    : isSecondary
      ? secondaryBg
      : isDestructive
        ? destructiveBg
        : "transparent"
  const resolvedButtonColor = buttonColor ?? defaultButtonColor
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
      buttonColor={resolvedButtonColor as any}
      textColor={resolvedTextColor as any}
      style={[
        styles.button,
        style,
        { borderColor: resolvedBorderColor, borderWidth: resolvedBorderColor ? 1 : 0 },
      ]}
      labelStyle={styles.label}
      contentStyle={[styles.content, contentStyle]}
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
  content: {
    height: 50,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
})
