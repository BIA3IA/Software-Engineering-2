import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale } from "@/theme/layout"
import { MetricCircle } from "@/components/ui/MetricCircle"
import { formatDuration, formatSpeed } from "@/utils/statsFormat"
import { Timer, TrendingUp } from "lucide-react-native"

type PerformanceMetricProps = {
  durationSeconds: number
  avgSpeed: number
}

export function PerformanceMetric({ durationSeconds, avgSpeed }: PerformanceMetricProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  return (
    <View style={styles.section}>
      <Text style={[textStyles.cardTitle, { color: palette.text.link }]}>
        Performance Metrics
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.surface.card },
        ]}
      >
        <View style={styles.grid}>
          <MetricCircle
            icon={<Timer size={iconSizes.lg} color={palette.accent.purple.base} />}
            value={formatDuration(durationSeconds)}
            label="Duration"
            accentColor={palette.accent.purple.base}
          />
          <MetricCircle
            icon={<TrendingUp size={iconSizes.lg} color={palette.brand.base} />}
            value={formatSpeed(avgSpeed)}
            label="Average Speed"
            accentColor={palette.brand.base}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: verticalScale(12),
  },
  card: {
    marginTop: verticalScale(6),
    paddingHorizontal: scale(12),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
})
