import React from "react"
import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { ChevronDown } from "lucide-react-native"

type Anchor = {
  top: number
  right: number
  width: number
}

type SelectFieldProps = {
  label: string
  valueLabel: string
  onOpen: (anchor: Anchor) => void
  active: boolean
}

export function SelectField({ label, valueLabel, onOpen, active }: SelectFieldProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const containerRef = React.useRef<View | null>(null)

  function handlePress() {
    const windowWidth = Dimensions.get("window").width
    containerRef.current?.measureInWindow((x, y, width, height) => {
      onOpen({
        top: y + height,
        right: Math.max(0, windowWidth - (x + width)),
        width,
      })
    })
  }

  return (
    <View
      style={styles.field}
      ref={(node) => {
        containerRef.current = node
      }}
    >
      <Text style={[textStyles.caption, styles.label, { color: palette.text.secondary }]}>
        {label}
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.input,
          {
            borderColor: palette.border.muted,
            backgroundColor: palette.surface.input,
          },
          active && { borderColor: palette.brand.base },
          pressed && { opacity: 0.9 },
        ]}
        onPress={handlePress}
      >
        <Text style={[textStyles.body, { color: palette.text.primary }]}>
          {valueLabel}
        </Text>
        <ChevronDown size={iconSizes.sm} color={palette.text.secondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    width: "100%",
  },
  label: {
    marginBottom: verticalScale(6),
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
})
