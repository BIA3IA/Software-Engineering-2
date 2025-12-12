import React from "react"
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { StatCard } from "@/components/ui/StatsCard"
import { MetricCircle } from "@/components/ui/MetricCircle"
import { useAuthStore } from "@/auth/storage"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { useRouter } from "expo-router"
import { MapPin, Route, TrendingUp, Clock, Mountain, Target, Leaf, ChevronDown, Bike } from "lucide-react-native"
import { ProfileHeroHeader } from "@/components/ProfileHeroHeader"

type PaletteKey = keyof (typeof Colors)["light"]
type IconType = React.ComponentType<{ size?: number; color?: string }>

type OverallStat = {
  id: string
  icon: IconType
  value: string
  label: string
  accent: PaletteKey
  background: PaletteKey
}

type ActivityStat = {
  id: string
  icon: IconType
  value: string
  label: string
  accent: PaletteKey
  progress: number
}

type ActivityPeriod = "day" | "week" | "month" | "year" | "overall"

const OVERALL_STATS: OverallStat[] = [
  {
    id: "distance",
    icon: MapPin,
    value: "342.7",
    label: "Total km",
    accent: "primary",
    background: "primarySoft",
  },
  {
    id: "trips",
    icon: Bike,
    value: "56",
    label: "Trips",
    accent: "purple",
    background: "purpleSoft",
  },
  {
    id: "paths",
    icon: Route,
    value: "8",
    label: "Paths",
    accent: "green",
    background: "greenSoft",
  },
]

const ACTIVITY_STATS: Record<ActivityPeriod, ActivityStat[]> = {
  day: [
    { id: "paths", icon: Bike, value: "1", label: "Paths", accent: "green", progress: 0.2 },
    { id: "trip-count", icon: Route, value: "2", label: "Trips", accent: "purple", progress: 0.3 },
    { id: "distance", icon: MapPin, value: "18.4 km", label: "Distance", accent: "primary", progress: 0.4 },
    { id: "time", icon: Clock, value: "1h 20m", label: "Time", accent: "orange", progress: 0.32 },
    { id: "avg-speed", icon: TrendingUp, value: "20.1 km/h", label: "Avg Speed", accent: "primary", progress: 0.52 },
    { id: "longest", icon: Target, value: "12.3 km", label: "Longest", accent: "red", progress: 0.38 },
    { id: "elevation", icon: Mountain, value: "210 m", label: "Elevation", accent: "green", progress: 0.28 },
    { id: "max-speed", icon: TrendingUp, value: "38.2 km/h", label: "Max Speed", accent: "purple", progress: 0.45 },
    { id: "co2", icon: Leaf, value: "4.1 kg", label: "CO₂ Saved", accent: "orange", progress: 0.33 },
  ],
  week: [
    { id: "paths", icon: Route, value: "4", label: "Paths", accent: "green", progress: 0.38 },
    { id: "trip-count", icon: Route, value: "7", label: "Trips", accent: "purple", progress: 0.52 },
    { id: "distance", icon: MapPin, value: "98.7 km", label: "Distance", accent: "primary", progress: 0.61 },
    { id: "time", icon: Clock, value: "6h 45m", label: "Time", accent: "orange", progress: 0.48 },
    { id: "avg-speed", icon: TrendingUp, value: "19.2 km/h", label: "Avg Speed", accent: "primary", progress: 0.58 },
    { id: "longest", icon: Target, value: "21.6 km", label: "Longest", accent: "red", progress: 0.46 },
    { id: "elevation", icon: Mountain, value: "720 m", label: "Elevation", accent: "green", progress: 0.55 },
    { id: "max-speed", icon: TrendingUp, value: "41.3 km/h", label: "Max Speed", accent: "purple", progress: 0.57 },
    { id: "co2", icon: Leaf, value: "18.6 kg", label: "CO₂ Saved", accent: "orange", progress: 0.5 },
  ],
  month: [
    { id: "paths", icon: Route, value: "9", label: "Paths", accent: "green", progress: 0.6 },
    { id: "trip-count", icon: Route, value: "20", label: "Trips", accent: "purple", progress: 0.72 },
    { id: "distance", icon: MapPin, value: "312.4 km", label: "Distance", accent: "primary", progress: 0.74 },
    { id: "time", icon: Clock, value: "18h 30m", label: "Time", accent: "orange", progress: 0.68 },
    { id: "avg-speed", icon: TrendingUp, value: "18.5 km/h", label: "Avg Speed", accent: "primary", progress: 0.66 },
    { id: "longest", icon: Target, value: "24.8 km", label: "Longest", accent: "red", progress: 0.48 },
    { id: "elevation", icon: Mountain, value: "1247 m", label: "Elevation", accent: "green", progress: 0.78 },
    { id: "max-speed", icon: TrendingUp, value: "42.3 km/h", label: "Max Speed", accent: "purple", progress: 0.62 },
    { id: "co2", icon: Leaf, value: "42.5 kg", label: "CO₂ Saved", accent: "orange", progress: 0.7 },
  ],
  year: [
    { id: "paths", icon: Route, value: "42", label: "Paths", accent: "green", progress: 0.8 },
    { id: "trip-count", icon: Route, value: "118", label: "Trips", accent: "purple", progress: 0.83 },
    { id: "distance", icon: MapPin, value: "2,812 km", label: "Distance", accent: "primary", progress: 0.9 },
    { id: "time", icon: Clock, value: "168h", label: "Time", accent: "orange", progress: 0.82 },
    { id: "avg-speed", icon: TrendingUp, value: "19.1 km/h", label: "Avg Speed", accent: "primary", progress: 0.71 },
    { id: "longest", icon: Target, value: "55.3 km", label: "Longest", accent: "red", progress: 0.64 },
    { id: "elevation", icon: Mountain, value: "6,430 m", label: "Elevation", accent: "green", progress: 0.84 },
    { id: "max-speed", icon: TrendingUp, value: "48.7 km/h", label: "Max Speed", accent: "purple", progress: 0.74 },
    { id: "co2", icon: Leaf, value: "258 kg", label: "CO₂ Saved", accent: "orange", progress: 0.88 },
  ],
  overall: [
    { id: "paths", icon: Route, value: "128", label: "Paths", accent: "green", progress: 0.95 },
    { id: "trip-count", icon: Route, value: "420", label: "Trips", accent: "purple", progress: 0.96 },
    { id: "distance", icon: MapPin, value: "6,957 km", label: "Distance", accent: "primary", progress: 0.98 },
    { id: "time", icon: Clock, value: "488h", label: "Time", accent: "orange", progress: 0.94 },
    { id: "avg-speed", icon: TrendingUp, value: "19.4 km/h", label: "Avg Speed", accent: "primary", progress: 0.82 },
    { id: "longest", icon: Target, value: "78.4 km", label: "Longest", accent: "red", progress: 0.76 },
    { id: "elevation", icon: Mountain, value: "12,874 m", label: "Elevation", accent: "green", progress: 0.91 },
    { id: "max-speed", icon: TrendingUp, value: "52.9 km/h", label: "Max Speed", accent: "purple", progress: 0.8 },
    { id: "co2", icon: Leaf, value: "612 kg", label: "CO₂ Saved", accent: "orange", progress: 0.94 },
  ],
}

const PERIOD_OPTIONS: { key: ActivityPeriod; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "overall", label: "Overall" },
]

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const NAV_H = verticalScale(72)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const displayName = user?.username ?? user?.email?.split("@")[0] ?? "Guest"
  const email = user?.email ?? "guest@bestbikepaths.com"
  const initial = displayName.charAt(0).toUpperCase()
  const [activityPeriod, setActivityPeriod] = React.useState<ActivityPeriod>("month")
  const [isPeriodMenuVisible, setPeriodMenuVisible] = React.useState(false)
  const [periodOverlayPosition, setPeriodOverlayPosition] = React.useState<{ top: number; right: number } | null>(null)
  const periodButtonRef = React.useRef<View | null>(null)
  const periodLabel = PERIOD_OPTIONS.find((opt) => opt.key === activityPeriod)?.label ?? "Month"

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bgSecondary }}
      contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeroHeader
        name={displayName}
        email={email}
        initial={initial}
        onSettingsPress={() => router.push("/settings")}
        onEditPress={() => {}}
      />

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
          <Text style={[textStyles.cardTitle, styles.cardTitle, { color: palette.textAccent }]}>Overall Stats</Text>

          <View style={styles.overallRow}>
            {OVERALL_STATS.map((stat) => {
              const Icon = stat.icon
              const accent = palette[stat.accent]
              const background = palette[stat.background]
              return (
                <StatCard
                  key={stat.id}
                  icon={<Icon size={iconSizes.xl} color={accent} />}
                  value={stat.value}
                  label={stat.label}
                  backgroundColor={background}
                  valueColor={accent}
                />
              )
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.bgPrimary, shadowColor: palette.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.cardTitle, { color: palette.textAccent }]}>Activity Stats</Text>

            <Pressable
              ref={(node) => {
                periodButtonRef.current = node
              }}
              onPress={() => {
                const button = periodButtonRef.current
                if (button) {
                  button.measureInWindow((x, y, width, height) => {
                    const screenWidth = Dimensions.get("window").width
                    const top = y + height + verticalScale(4)
                    const right = Math.max(scale(16), screenWidth - (x + width))
                    setPeriodOverlayPosition({ top, right })
                    setPeriodMenuVisible(true)
                  })
                } else {
                  setPeriodOverlayPosition(null)
                  setPeriodMenuVisible(true)
                }
              }}
              style={({ pressed }) => [
                styles.fakeSelect,
                {
                  backgroundColor: palette.primary,
                  borderColor: palette.primary,
                  shadowColor: palette.border,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.periodLabelWrap}>
                <Text style={[textStyles.caption, styles.periodLabel]}>{periodLabel}</Text>
                <ChevronDown size={iconSizes.xs} color={palette.textInverse} />
              </View>
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            {ACTIVITY_STATS[activityPeriod].map((stat) => {
              const Icon = stat.icon
              const accent = palette[stat.accent]
              return (
                <MetricCircle
                  key={stat.id}
                  icon={<Icon size={iconSizes.lg} color={accent} />}
                  value={stat.value}
                  label={stat.label}
                  accentColor={accent}
                  progress={stat.progress}
                  columns={3}
                />
              )
            })}
          </View>
        </View>
      </View>

      <SelectionOverlay
        visible={isPeriodMenuVisible}
        options={PERIOD_OPTIONS}
        selectedKey={activityPeriod}
        topOffset={periodOverlayPosition?.top}
        rightOffset={periodOverlayPosition?.right}
        onClose={() => setPeriodMenuVisible(false)}
        onSelect={(key) => {
          setActivityPeriod(key as ActivityPeriod)
          setPeriodMenuVisible(false)
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    marginTop: -verticalScale(36),
    paddingHorizontal: scale(20),
    gap: verticalScale(18),
  },
  card: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(18),
    borderRadius: radius.xl,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: radius.xl,
    elevation: 4,
  },
  cardTitle: {
    marginBottom: verticalScale(14),
  },
  overallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(12),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },
  fakeSelect: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(4),
    columnGap: scale(6),
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: radius.md,
    elevation: 4,
  },
  periodLabel: {
    color: Colors.light.textInverse,
  },
  periodLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: scale(6),
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
})
