import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { controlSizes, radius, spacing } from "@/theme/layout"

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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: controlSizes.badge,
    height: controlSizes.badge,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: {
    fontWeight: "700",
  },
})
