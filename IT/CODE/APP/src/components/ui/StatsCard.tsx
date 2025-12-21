import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"

type StatCardProps = {
  icon: React.ReactNode
  value: string
  label: string
  backgroundColor: string
  valueColor?: string
  iconWrapColor?: string
}

export function StatCard({
  icon,
  value,
  label,
  backgroundColor,
  valueColor,
  iconWrapColor,
}: StatCardProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconWrapColor ?? "transparent" }]}>
        {icon}
      </View>

      <Text style={[textStyles.cardTitle, styles.value, { color: valueColor ?? palette.text.link }]}>
        {value}
      </Text>
      <Text style={[textStyles.caption, { color: palette.text.secondary }]}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: scale(42),
    height: scale(42),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(6),
  },
  value: {
    fontWeight: "700",
  },
})
