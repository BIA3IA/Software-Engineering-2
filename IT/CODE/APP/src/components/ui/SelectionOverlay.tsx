import React from "react"
import { Modal, Pressable, View, Text, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { radius, scale, verticalScale } from "@/theme/layout"
import { textStyles } from "@/theme/typography"

export type SelectionOverlayOption = {
  key: string
  label: string
}

type SelectionOverlayProps = {
  visible: boolean
  options: SelectionOverlayOption[]
  selectedKey?: string
  onClose: () => void
  onSelect: (key: string) => void

  topOffset?: number
  rightOffset?: number
  width?: number
  absoluteTop?: number
}

export function SelectionOverlay({
  visible,
  options,
  selectedKey,
  onClose,
  onSelect,
  topOffset = verticalScale(76),
  rightOffset = scale(16),
  width,
  absoluteTop,
}: SelectionOverlayProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()

  const cardTop = typeof absoluteTop === "number" ? absoluteTop : topOffset + insets.top

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.bgPrimary,
              top: cardTop,
              right: rightOffset,
              width: width ?? scale(190),
              shadowColor: palette.border,
            },
          ]}
        >
          {options.map((option) => {
            const isActive = option.key === selectedKey

            return (
              <Pressable
                key={option.key}
                onPress={() => onSelect(option.key)}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: isActive
                      ? palette.primarySoft
                      : "transparent",
                    borderRadius: radius.md,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    textStyles.body,
                    styles.itemText,
                    { color: isActive ? palette.primaryDark : palette.textPrimary },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  card: {
    position: "absolute",
    width: scale(190),
    borderRadius: radius.lg,
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(6),
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: radius.lg,
    elevation: 10,
  },
  item: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(10),
  },
  itemText: {
    fontSize: 14,
  },
})
