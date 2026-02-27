import React from "react"
import { Modal, Pressable, View, Text, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { overlayMetrics, radius, spacing } from "@/theme/layout"
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
  topOffset = 76,
  rightOffset = spacing.md,
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
              backgroundColor: palette.surface.card,
              top: cardTop,
              right: rightOffset,
              width: width ?? overlayMetrics.menuWidth,
              shadowColor: palette.border.muted,
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
                      ? palette.brand.surface
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
                    { color: isActive ? palette.brand.dark : palette.text.primary },
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
    width: overlayMetrics.menuWidth,
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: radius.lg,
    elevation: 10,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  itemText: {
    fontSize: textStyles.body.fontSize,
  },
})
