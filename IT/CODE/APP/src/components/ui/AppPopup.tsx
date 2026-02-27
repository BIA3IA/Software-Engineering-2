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
import { overlayMetrics, radius, screenMetrics, shadowStyles, spacing } from "@/theme/layout"
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
  dismissible?: boolean
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
  dismissible = true,
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
  const iconElement = React.isValidElement<{ color?: string }>(icon) ? icon : null
  const shouldOverrideIconColor = scheme === "dark" && !iconElement?.props?.color
  const iconColor = shouldOverrideIconColor ? palette.overlay.iconOnDark : undefined

  let renderedIcon = icon
  if (shouldOverrideIconColor && iconElement) {
    renderedIcon = React.cloneElement(
      iconElement,
      { color: iconColor }
    )
  }

  function handleBackdropPress() {
    if (!dismissible) return
    onClose?.()
  }

  const hasSecondary = Boolean(secondaryButton)
  const hasDestructive = Boolean(destructiveButton)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
    >
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
    paddingTop: overlayMetrics.modalTopInset,
  },
  card: {
    width: overlayMetrics.modalWidth,
    borderRadius: radius.xl,
    paddingHorizontal: screenMetrics.screenPaddingX,
    paddingTop: overlayMetrics.modalPaddingTop,
    paddingBottom: overlayMetrics.modalPaddingBottom,
    ...shadowStyles.modal,
  },
  iconWrapper: {
    alignSelf: "center",
    width: overlayMetrics.modalIconSize,
    height: overlayMetrics.modalIconSize,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
  },
  buttonsColumn: {
    width: "100%",
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
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
