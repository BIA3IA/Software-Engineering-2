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
import { MapPin, Route, TrendingUp, Timer, Clock, Mountain, Target, Leaf, ChevronDown, Bike, AlertTriangle, Ruler, Hourglass } from "lucide-react-native"
import { ProfileHeroHeader } from "@/components/profile/ProfileHeroHeader"
import { AppPopup } from "@/components/ui/AppPopup"
import { getApiErrorMessage } from "@/utils/apiError"
import { getStatsApi, type StatsPeriodKey, type StatsPeriod } from "@/api/stats"

type AccentName = "brand" | keyof (typeof Colors)["light"]["accent"]
type IconType = React.ComponentType<{ size?: number; color?: string }>

type OverallStat = {
  id: string
  icon: IconType
  value: string
  label: string
  accent: AccentName
  background: AccentName
}

type ActivityStat = {
  id: string
  icon: IconType
  value: string
  label: string
  accent: AccentName
  progress: number
}

type ActivityPeriod = "day" | "week" | "month" | "year" | "overall"

const EMPTY_STATS: StatsPeriod = {
  userId: "guest",
  period: "OVERALL",
  avgSpeed: 0,
  avgDuration: 0,
  avgKilometers: 0,
  totalKilometers: 0,
  totalTime: 0,
  longestKilometer: 0,
  longestTime: 0,
  pathsCreated: 0,
  tripCount: 0,
  updatedAt: new Date().toISOString(),
}

const PERIOD_OPTIONS: { key: ActivityPeriod; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
  { key: "overall", label: "Overall" },
]

function getAccentFill(palette: (typeof Colors)["light"], accent: AccentName) {
  return accent === "brand" ? palette.brand.base : palette.accent[accent].base
}

function getAccentSurface(palette: (typeof Colors)["light"], accent: AccentName) {
  return accent === "brand" ? palette.brand.surface : palette.accent[accent].surface
}

function formatKm(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 km"
  return `${value.toFixed(1)} km`
}

function formatSpeed(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 km/h"
  return `${value.toFixed(1)} km/h`
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0"
  return `${Math.round(value)}`
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m"
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours > 0) {
    return `${hours}h ${remaining}m`
  }
  return `${remaining}m`
}

function getProgress(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(1, Math.max(0, value / total))
}

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const NAV_H = verticalScale(72)
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const isGuest = user?.id === "guest"
  const displayName = user?.username ?? user?.email?.split("@")[0] ?? "Guest"
  const email = user?.email ?? "guest@bestbikepaths.com"
  const initial = displayName.charAt(0).toUpperCase()
  const [activityPeriod, setActivityPeriod] = React.useState<ActivityPeriod>("month")
  const [isPeriodMenuVisible, setPeriodMenuVisible] = React.useState(false)
  const [periodOverlayPosition, setPeriodOverlayPosition] = React.useState<{ top: number; right: number } | null>(null)
  const periodButtonRef = React.useRef<View | null>(null)
  const periodLabel = PERIOD_OPTIONS.find((opt) => opt.key === activityPeriod)?.label ?? "Month"
  const lastFetchedUserId = React.useRef<string | null>(null)
  const lastFetchedStatsUserId = React.useRef<string | null>(null)
  const [errorPopup, setErrorPopup] = React.useState({
    visible: false,
    title: "Profile error",
    message: "",
  })
  const [statsByPeriod, setStatsByPeriod] = React.useState<Record<StatsPeriodKey, StatsPeriod> | null>(null)

  const closeProfileError = React.useCallback(() => {
    setErrorPopup((prev) => ({
      ...prev,
      visible: false,
    }))
  }, [])

  const showProfileError = React.useCallback((message: string, title = "Profile error") => {
    setErrorPopup({
      visible: true,
      title,
      message,
    })
  }, [])

  React.useEffect(() => {
    if (!user || isGuest) {
      lastFetchedUserId.current = null
      lastFetchedStatsUserId.current = null
      setStatsByPeriod(null)
      return
    }
    if (lastFetchedUserId.current === user.id) {
      return
    }
    lastFetchedUserId.current = user.id
    void fetchProfile().catch((error) => {
      const message = getApiErrorMessage(error, "Unable to refresh the profile.")
      showProfileError(message)
    })
  }, [user, isGuest, fetchProfile, showProfileError])

  React.useEffect(() => {
    if (!user || isGuest) {
      return
    }
    if (lastFetchedStatsUserId.current === user.id) {
      return
    }
    lastFetchedStatsUserId.current = user.id
    void getStatsApi()
      .then((stats) => {
        setStatsByPeriod(stats)
      })
      .catch((error) => {
        const message = getApiErrorMessage(error, "Unable to load statistics.")
        showProfileError(message, "Statistics error")
      })
  }, [user, isGuest, showProfileError])

  const currentStats = statsByPeriod?.[activityPeriod] ?? EMPTY_STATS
  const overallStats = statsByPeriod?.overall ?? EMPTY_STATS

  const overallCards: OverallStat[] = [
    {
      id: "distance",
      icon: MapPin,
      value: formatKm(overallStats.totalKilometers),
      label: "Distance",
      accent: "brand",
      background: "brand",
    },
    {
      id: "trips",
      icon: Bike,
      value: formatCount(overallStats.tripCount),
      label: "Trips",
      accent: "purple",
      background: "purple",
    },
    {
      id: "paths",
      icon: Route,
      value: formatCount(overallStats.pathsCreated),
      label: "Paths",
      accent: "green",
      background: "green",
    },
  ]

  const activityStats: ActivityStat[] = [
    {
      id: "total-distance",
      icon: MapPin,
      value: formatKm(currentStats.totalKilometers),
      label: "Total Distance",
      accent: "blue",
      progress: getProgress(currentStats.totalKilometers, overallStats.totalKilometers),
    },
    {
      id: "total-time",
      icon: Clock,
      value: formatDuration(currentStats.totalTime),
      label: "Total Time",
      accent: "purple",
      progress: getProgress(currentStats.totalTime, overallStats.totalTime),
    },
    {
      id: "paths",
      icon: Route,
      value: formatCount(currentStats.pathsCreated),
      label: "Paths",
      accent: "green",
      progress: getProgress(currentStats.pathsCreated, overallStats.pathsCreated),
    },
    {
      id: "longest-km",
      icon: Mountain,
      value: formatKm(currentStats.longestKilometer),
      label: "Longest km",
      accent: "green",
      progress: getProgress(currentStats.longestKilometer, overallStats.longestKilometer),
    },
    {
      id: "longest-time",
      icon: Hourglass,
      value: formatDuration(currentStats.longestTime),
      label: "Longest time",
      accent: "blue",
      progress: getProgress(currentStats.longestTime, overallStats.longestTime),
    },
    {
      id: "trip-count",
      icon: Bike,
      value: formatCount(currentStats.tripCount),
      label: "Trips",
      accent: "purple",
      progress: getProgress(currentStats.tripCount, overallStats.tripCount),
    },
    {
      id: "avg-km",
      icon: Ruler,
      value: formatKm(currentStats.avgKilometers),
      label: "Avg Distance",
      accent: "blue",
      progress: getProgress(currentStats.avgKilometers, overallStats.avgKilometers),
    },
    {
      id: "avg-duration",
      icon: Timer,
      value: formatDuration(currentStats.avgDuration),
      label: "Avg Time",
      accent: "purple",
      progress: getProgress(currentStats.avgDuration, overallStats.avgDuration),
    },
    {
      id: "avg-speed",
      icon: TrendingUp,
      value: formatSpeed(currentStats.avgSpeed),
      label: "Avg Speed",
      accent: "green",
      progress: getProgress(currentStats.avgSpeed, overallStats.avgSpeed),
    },
  ]

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.surface.screen }}
        contentContainerStyle={{ paddingBottom: NAV_H + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
      <ProfileHeroHeader
        name={displayName}
        email={email}
        initial={initial}
        onSettingsPress={() => router.push("/settings")}
        onEditPress={() => router.push("/edit-profile")}
      />

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>
          <Text style={[textStyles.cardTitle, styles.cardTitle, { color: palette.text.link }]}>Overall Stats</Text>

          <View style={styles.overallRow}>
            {overallCards.map((stats) => {
              const Icon = stats.icon
              const accent = getAccentFill(palette, stats.accent)
              const background = getAccentSurface(palette, stats.background)
              return (
                <StatCard
                  key={stats.id}
                  icon={<Icon size={iconSizes.xl} color={accent} />}
                  value={stats.value}
                  label={stats.label}
                  backgroundColor={background}
                  valueColor={accent}
                />
              )
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.cardTitle, { color: palette.text.link }]}>Activity Stats</Text>

            <Pressable
              ref={(node) => {
                periodButtonRef.current = node
              }}
              testID="profile-period-selector"
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
                  backgroundColor: palette.brand.base,
                  borderColor: palette.brand.base,
                  shadowColor: palette.border.muted,
                },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.periodLabelWrap}>
                <Text style={[textStyles.caption, styles.periodLabel]}>{periodLabel}</Text>
                <ChevronDown size={iconSizes.xs} color={palette.text.onAccent} />
              </View>
            </Pressable>
          </View>

          <View style={styles.metricsGrid}>
            {activityStats.map((stats) => {
              const Icon = stats.icon
              const accent = getAccentFill(palette, stats.accent)
              return (
                <MetricCircle
                  key={stats.id}
                  icon={<Icon size={iconSizes.lg} color={accent} />}
                  value={stats.value}
                  label={stats.label}
                  accentColor={accent}
                  progress={stats.progress}
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
      <AppPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message || "An unexpected error occurred."}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={closeProfileError}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: closeProfileError,
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
      />
    </>
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
    color: Colors.light.text.onAccent,
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
