import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"

type RouteSummaryProps = {
  date: string
  durationLabel: string
  pathName: string
}

export function RouteSummary({
  date,
  durationLabel,
  pathName,
}: RouteSummaryProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={styles.section}>
      <Text style={[textStyles.cardTitle, { color: palette.text.link }]}>
        Route Summary
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.surface.card, borderColor: palette.border.muted },
        ]}
      >
        <Row label="Date" value={date} />
        <Row label="Duration" value={durationLabel} />
        <Row label="Path" value={pathName} isLast />
      </View>
    </View>
  )
}

function Row({
  label,
  value,
  isLast,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border.muted }]}>
      <Text style={[textStyles.bodySmall, { color: palette.text.secondary }]}>
        {label}
      </Text>
      <Text style={[textStyles.bodySmall, styles.value, { color: palette.text.link }]}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: verticalScale(14),
  },
  card: {
    marginTop: verticalScale(8),
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: verticalScale(10),
  },
  value: {
    fontWeight: "700",
  },
})
