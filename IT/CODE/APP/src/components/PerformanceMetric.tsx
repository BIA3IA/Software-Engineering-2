import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale } from "@/theme/layout"
import { MetricCircle } from "@/components/ui/MetricCircle"
import { MapPin, TrendingUp, Mountain } from "lucide-react-native"

type PerformanceMetricProps = {
  duration: string
  avgSpeed: string
  maxSpeed: string
  elevation: string
}

export function PerformanceMetric({
  duration,
  avgSpeed,
  maxSpeed,
  elevation,
}: PerformanceMetricProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  return (
    <View style={styles.section}>
      <Text style={[textStyles.cardTitle, { color: palette.textAccent }]}>
        Performance Metrics
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: palette.bgPrimary },
        ]}
      >
        <View style={styles.grid}>
          <MetricCircle
            icon={<MapPin size={iconSizes.lg} color={palette.purple} />}
            value={duration}
            label="Duration"
            accentColor={palette.purple}
          />
          <MetricCircle
            icon={<TrendingUp size={iconSizes.lg} color={palette.primary} />}
            value={avgSpeed}
            label="Avg Speed"
            accentColor={palette.primary}
          />
          <MetricCircle
            icon={<TrendingUp size={iconSizes.lg} color={palette.orange} />}
            value={maxSpeed}
            label="Max Speed"
            accentColor={palette.orange}
          />
          <MetricCircle
            icon={<Mountain size={iconSizes.lg} color={palette.green} />}
            value={elevation}
            label="Elevation"
            accentColor={palette.green}
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
    marginTop: verticalScale(10),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
})
