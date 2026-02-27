import React from "react"
import { View, Text, StyleSheet } from "react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { textStyles } from "@/theme/typography"
import { radius, scale, spacing } from "@/theme/layout"

type ToneKey = "purple" | "green" | "orange" | "red" | "blue"

type CalloutItem = {
  value: string
  tone?: ToneKey
}

type MapCalloutProps = {
  items: CalloutItem[]
  variant?: ToneKey
}

export function MapCallout({ items, variant }: MapCalloutProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const accent = variant ? palette.accent[variant] : palette.accent.blue

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: accent.bold,
            borderColor: palette.text.onAccent,
            shadowColor: accent.bold,
          },
        ]}
      >
        {items.map((item, index) => (
          <View key={`${item.value}-${index}`} style={index > 0 ? styles.itemDivider : undefined}>
            <Text
              style={[
                styles.value,
                index === 0 ? textStyles.bodyBold : textStyles.bodySmall,
                { color: palette.text.onAccent },
              ]}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.arrowWrap}>
        <View style={[styles.arrowOuter, { borderTopColor: palette.text.onAccent }]} />
        <View style={[styles.arrowInner, { borderTopColor: accent.bold }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  card: {
    alignSelf: "center",
    minWidth: scale(150),
    borderRadius: radius.lg,
    borderWidth: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  value: {
    marginTop: 2,
    textAlign: "center",
  },
  itemDivider: {
    paddingTop: 4,
  },
  arrowWrap: {
    position: "relative",
    width: 0,
    height: 0,
  },
  arrowOuter: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(8),
    borderRightWidth: scale(8),
    borderTopWidth: scale(10),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  arrowInner: {
    position: "absolute",
    left: -scale(7),
    top: -scale(9),
    width: 0,
    height: 0,
    borderLeftWidth: scale(7),
    borderRightWidth: scale(7),
    borderTopWidth: scale(9),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
})
