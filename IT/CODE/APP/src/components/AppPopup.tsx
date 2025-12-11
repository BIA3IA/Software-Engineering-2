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
  variant?: "primary" | "secondary" | "outline"
}

type AppPopupProps = {
  visible: boolean
  title: string
  message: string
  icon?: React.ReactNode
  iconBackgroundColor?: string
  onClose?: () => void
  dismissOnBackdropPress?: boolean
  primaryButton: PopupButtonConfig
}

export function AppPopup({
  visible,
  title,
  message,
  icon,
  iconBackgroundColor,
  onClose,
  dismissOnBackdropPress = true,
  primaryButton,
}: AppPopupProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const iconBg = iconBackgroundColor ?? palette.bgAccent

  function handleBackdropPress() {
    if (!dismissOnBackdropPress) return
    onClose?.()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <View style={styles.centerWrapper} pointerEvents="box-none">
          <View
            style={[
              styles.card,
              { backgroundColor: palette.bgPrimary, shadowColor: palette.border },
            ]}
          >
            <View style={styles.handle} />

            {icon && (
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: iconBg },
                ]}
              >
                {icon}
              </View>
            )}

            <Text
              style={[
                textStyles.screenTitle,
                styles.title,
                { color: palette.textAccent },
              ]}
            >
              {title}
            </Text>

            <Text
              style={[
                textStyles.heroSubtitle,
                styles.message,
                { color: palette.textSecondary},
              ]}
            >
              {message}
            </Text>

            <View style={styles.button}>
              <AppButton
                title={primaryButton.label}
                variant={primaryButton.variant ?? "primary"}
                onPress={() => primaryButton.onPress({} as GestureResponderEvent)}
              />
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
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
  handle: {
    alignSelf: "center",
    width: scale(44),
    height: verticalScale(4),
    borderRadius: radius.full,
    marginBottom: verticalScale(16),
    backgroundColor: "rgba(148,163,184,0.6)",
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
  button: {
    width: "100%",
  },
})
