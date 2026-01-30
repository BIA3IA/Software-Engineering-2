import React from "react"
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
} from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { verticalScale, scale, radius } from "@/theme/layout"
import { AppButton } from "@/components/ui/AppButton"

type PopupButtonConfig = {
  label: string
  onPress: (event: GestureResponderEvent) => void
  variant?: "primary" | "secondary" | "outline" | "destructive"
  textColor?: string
  borderColor?: string
  buttonColor?: string
}

type AppPopupProps = {
  visible: boolean
  title: string
  message: string
  icon?: React.ReactNode
  iconBackgroundColor?: string
  onClose?: () => void
  primaryButton: PopupButtonConfig
  secondaryButton?: PopupButtonConfig
  destructiveButton?: PopupButtonConfig
}

export function AppPopup({
  visible,
  title,
  message,
  icon,
  iconBackgroundColor,
  onClose,
  primaryButton,
  secondaryButton,
  destructiveButton,
}: AppPopupProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const primaryVariant = primaryButton.variant ?? "primary"

  function getVariantAccent(variant: PopupButtonConfig["variant"]) {
    switch (variant) {
      case "secondary":
        return palette.button.secondary.text
      case "outline":
        return palette.button.outline.text
      case "destructive":
        return palette.button.danger.bg
      case "primary":
      default:
        return palette.button.primary.bg
    }
  }

  const accentColor = primaryButton.buttonColor ?? getVariantAccent(primaryVariant)
  const iconBgLight = iconBackgroundColor ?? palette.surface.accent
  const iconBackground = scheme === "dark" ? (primaryButton.buttonColor ?? accentColor) : iconBgLight
  const shouldOverrideIconColor = scheme === "dark"
  const iconColor = shouldOverrideIconColor ? palette.overlay.iconOnDark : undefined

  let renderedIcon = icon
  if (shouldOverrideIconColor && icon && React.isValidElement(icon)) {
    renderedIcon = React.cloneElement(
      icon as React.ReactElement<{ color?: string }>,
      { color: iconColor }
    )
  }

  function handleBackdropPress() {
    onClose?.()
  }

  const hasSecondary = Boolean(secondaryButton)
  const hasDestructive = Boolean(destructiveButton)

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: palette.overlay.scrim }]}>
        <Pressable style={styles.dismissArea} onPress={handleBackdropPress} />
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface.card, shadowColor: palette.border.muted },
            ]}
          >

            {renderedIcon && (
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: iconBackground },
                ]}
              >
                {renderedIcon}
              </View>
            )}

            <Text
              style={[
                textStyles.screenTitle,
                styles.title,
                { color: accentColor },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                textStyles.heroSubtitle,
                styles.message,
                { color: palette.text.secondary },
              ]}
            >
              {message}
            </Text>

            <View style={styles.buttonsColumn}>
              <View style={styles.buttonRow}>
                {hasSecondary ? (
                  <>
                    <View style={[styles.button, styles.buttonLeft]}>
                      <AppButton
                        title={primaryButton.label}
                        variant={primaryButton.variant ?? "primary"}
                        onPress={() => primaryButton.onPress({} as GestureResponderEvent)}
                        textColor={primaryButton.textColor}
                        borderColor={primaryButton.borderColor}
                        buttonColor={primaryButton.buttonColor}
                      />
                    </View>
                    <View style={styles.button}>
                      <AppButton
                        title={secondaryButton!.label}
                        variant={secondaryButton!.variant ?? "secondary"}
                        textColor={secondaryButton!.textColor ?? accentColor}
                        borderColor={secondaryButton!.borderColor ?? accentColor}
                        buttonColor={secondaryButton!.buttonColor}
                        onPress={() => secondaryButton!.onPress({} as GestureResponderEvent)}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.button}>
                    <AppButton
                      title={primaryButton.label}
                      variant={primaryButton.variant ?? "primary"}
                      onPress={() => primaryButton.onPress({} as GestureResponderEvent)}
                      textColor={primaryButton.textColor}
                      borderColor={primaryButton.borderColor}
                      buttonColor={primaryButton.buttonColor}
                    />
                  </View>
                )}
              </View>

              {hasDestructive && (
                <View style={[styles.button, styles.destructiveButton]}>
                  <AppButton
                    title={destructiveButton!.label}
                    variant={destructiveButton!.variant ?? "destructive"}
                    onPress={() => destructiveButton!.onPress({} as GestureResponderEvent)}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: verticalScale(40),
  },
  card: {
    width: "92%",
    borderRadius: radius.xl,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(24),
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 10,
  },
  iconWrapper: {
    alignSelf: "center",
    width: scale(80),
    height: scale(80),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(16),
  },
  title: {
    textAlign: "center",
    marginBottom: verticalScale(6),
  },
  message: {
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  buttonsColumn: {
    width: "100%",
    gap: verticalScale(12),
  },
  buttonRow: {
    flexDirection: "row",
    gap: scale(12),
  },
  button: {
    flex: 1,
  },
  buttonLeft: {
    marginRight: 0,
  },
  destructiveButton: {
    alignSelf: "stretch",
  },
})
