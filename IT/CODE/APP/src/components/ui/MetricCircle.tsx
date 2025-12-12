import React from "react"
import { View, Text, StyleSheet } from "react-native"
import Svg, { Circle } from "react-native-svg"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"

type MetricCircleProps = {
  icon: React.ReactNode
  value: string
  label: string
  accentColor: string
  progress?: number
}

export function MetricCircle({
  icon,
  value,
  label,
  accentColor,
  progress = 0.72,
}: MetricCircleProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const size = scale(64)
  const stroke = scale(6)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dashOffset = c * (1 - clamp01(progress))

  return (
    <View style={styles.container}>
      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={palette.border}
            strokeWidth={stroke}
            fill="none"
            opacity={0.35}
          />

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={accentColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={dashOffset}
            rotation={-90}
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>

        <View style={styles.iconCenter}>
          {icon}
        </View>
      </View>

      <Text style={[textStyles.bodySmall, styles.value, { color: palette.textAccent }]}>
        {value}
      </Text>
      <Text style={[textStyles.caption, { color: palette.textSecondary }]}>
        {label}
      </Text>
    </View>
  )
}

function clamp01(n: number) {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

const styles = StyleSheet.create({
  container: {
    width: "50%",
    alignItems: "center",
    paddingVertical: verticalScale(10),
  },
  ringWrap: {
    width: scale(64),
    height: scale(64),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },
  iconCenter: {
    position: "absolute",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontWeight: "700",
  },
})
