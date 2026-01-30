import React, { useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import { useFocusEffect } from "expo-router"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { RouteCard, RouteItem } from "@/components/route/RouteCard"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { AppPopup } from "@/components/ui/AppPopup"
import { scale, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import { Trash2 } from "lucide-react-native"
import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { deleteTripApi, getMyTripsApi, type TripSummary } from "@/api/trips"
import { getApiErrorMessage } from "@/utils/apiError"
import { formatDate } from "@/utils/date"
import { buildRouteFromPathPointSegments } from "@/utils/routes"

type SortOption = "date" | "distance" | "duration" | "alphabetical"

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "distance", label: "Distance" },
  { key: "duration", label: "Duration" },
  { key: "alphabetical", label: "Alphabetical" },
]

export default function TripHistoryScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const deleteIconSize = iconSizes.xl

  const [trips, setTrips] = useState<RouteItem[]>([])
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [isSortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [pendingDeleteTrip, setPendingDeleteTrip] = useState<RouteItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)
  const [errorPopup, setErrorPopup] = useState({
    visible: false,
    title: "",
    message: "",
  })
  const lastScrollOffset = React.useRef(0)

  const loadTrips = React.useCallback(() => {
    let isActive = true

    async function fetchTrips() {
      try {
        const response = await getMyTripsApi()
        if (!isActive) return
        setTrips(response.map(mapTripSummaryToRouteItem))
        if (response.length === 0) {
          setEmptyMessage("Your Trip History is empty.\nStart recording trips to see them here.")
        } else {
          setEmptyMessage(null)
        }
      } catch (error) {
        const message = getApiErrorMessage(error, "Unable to load your trips. Please try again.")
        setEmptyMessage(null)
        setErrorPopup({
          visible: true,
          title: "Loading failed",
          message,
        })
      }
    }

    fetchTrips()

    return () => {
      isActive = false
    }
  }, [])

  const sortedTrips = useMemo(() => {
    const parseDate = (value: string) => {
      const [day, month, year] = value.split("/").map(Number)
      return new Date(2000 + year, (month ?? 1) - 1, day ?? 1).getTime()
    }

    return [...trips].sort((a, b) => {
      switch (sortOption) {
        case "distance":
          return b.distanceKm - a.distanceKm
        case "duration":
          return b.durationMin - a.durationMin
        case "alphabetical":
          return a.name.localeCompare(b.name)
        case "date":
        default:
          return parseDate(b.date) - parseDate(a.date)
      }
    })
  }, [sortOption, trips])

  function handleToggleTrip(id: string) {
    setExpandedTripId((current) => (current === id ? null : id))
  }

  function handleSortPress() {
    setSortMenuVisible(true)
  }

  function handleSortOptionSelect(option: SortOption) {
    setSortOption(option)
    setSortMenuVisible(false)
  }

  function handleCloseSortMenu() {
    setSortMenuVisible(false)
  }

  function handleRequestDeleteTrip(trip: RouteItem) {
    setPendingDeleteTrip(trip)
  }

  async function handleConfirmDeleteTrip() {
    if (!pendingDeleteTrip || isDeleting) return
    const tripId = pendingDeleteTrip.id
    setIsDeleting(true)
    try {
      await deleteTripApi(tripId)
      setTrips((current) => current.filter((trip) => trip.id !== tripId))
      setExpandedTripId((current) => (current === tripId ? null : current))
      setPendingDeleteTrip(null)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to delete the trip. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Delete failed",
        message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancelDeleteTrip() {
    setPendingDeleteTrip(null)
  }

  function handleListScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetY = event.nativeEvent.contentOffset.y
    const diff = offsetY - lastScrollOffset.current

    if (diff > 12 && offsetY > 40) {
      setNavHidden(true)
    } else if (diff < -12) {
      setNavHidden(false)
    }

    lastScrollOffset.current = offsetY
  }

  React.useEffect(() => {
    return () => {
      setNavHidden(false)
    }
  }, [setNavHidden])

  useFocusEffect(loadTrips)

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.screen }]}>
      <FlatList
        style={styles.list}
        data={sortedTrips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: scale(16) },
        ]}
        renderItem={({ item, index }) => (
          <View style={index === 0 ? styles.firstCardWrapper : undefined}>
            <RouteCard
              trip={item}
              isExpanded={expandedTripId === item.id}
              onToggle={() => handleToggleTrip(item.id)}
              onDeletePress={() => handleRequestDeleteTrip(item)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ScreenHeader onSortPress={handleSortPress} />
            <View style={styles.headerSpacer} />
          </View>
        }
        ListEmptyComponent={
          emptyMessage ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                {emptyMessage}
              </Text>
            </View>
          ) : null
        }
        onScroll={handleListScroll}
        scrollEventThrottle={16}
      />

      <SelectionOverlay
        visible={isSortMenuVisible}
        options={SORT_OPTIONS}
        selectedKey={sortOption}
        onClose={handleCloseSortMenu}
        onSelect={(key) => handleSortOptionSelect(key as SortOption)}
      />

      <AppPopup
        visible={Boolean(pendingDeleteTrip)}
        title="Delete Trip?"
        message="Are you sure you want to delete this trip? This action cannot be undone."
        icon={<Trash2 size={deleteIconSize} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleCancelDeleteTrip}
        primaryButton={{
          label: isDeleting ? "Deleting..." : "Yes, Delete",
          variant: "destructive",
          onPress: handleConfirmDeleteTrip,
        }}
        secondaryButton={{
          label: "No, Cancel",
          variant: "secondary",
          onPress: handleCancelDeleteTrip,
        }}
      />

      <AppPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message}
        icon={<Trash2 size={deleteIconSize} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={() => setErrorPopup((prev) => ({ ...prev, visible: false }))}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: () => setErrorPopup((prev) => ({ ...prev, visible: false })),
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
      />
    </View>
  )
}

function mapTripSummaryToRouteItem(trip: TripSummary): RouteItem {
  const route = buildRouteFromPathPointSegments(trip.tripSegments ?? [])
  const fallbackRoute = [
    { latitude: trip.origin.lat, longitude: trip.origin.lng },
    { latitude: trip.destination.lat, longitude: trip.destination.lng },
  ]

  const stats = trip.stats
  const weather = trip.weather as
    | {
        dominantWeatherDescription?: string
        averageWindSpeed?: number
        averageHumidity?: number
        averagePressure?: number
        averageTemperature?: number
        averageApparentTemperature?: number
        totalPrecipitation?: number
      }
    | null

  return {
    id: trip.tripId,
    name: trip.title ?? "Trip",
    description: undefined,
    distanceKm: stats?.kilometers ?? 0,
    durationMin: stats?.duration ? stats.duration / 60 : 0,
    date: formatDate(trip.startedAt ?? trip.createdAt),
    avgSpeed: stats?.avgSpeed ?? 0,
    showWeatherBadge: Boolean(weather),
    temperatureLabel:
      weather?.averageTemperature !== undefined ? `${weather.averageTemperature.toFixed(1)}°` : undefined,
    weather: weather
      ? {
          condition: weather.dominantWeatherDescription ?? "Unknown",
          windSpeed:
            weather.averageWindSpeed !== undefined
              ? `${weather.averageWindSpeed.toFixed(1)} km/h`
              : "N/A",
          humidity: weather.averageHumidity !== undefined ? `${weather.averageHumidity}%` : "N/A",
          visibility: "N/A",
          feelsLike:
            weather.averageApparentTemperature !== undefined
              ? `${weather.averageApparentTemperature.toFixed(1)}°`
              : "N/A",
          precipitation:
            weather.totalPrecipitation !== undefined
              ? `${weather.totalPrecipitation.toFixed(1)} mm`
              : "N/A",
          pressure:
            weather.averagePressure !== undefined ? `${weather.averagePressure.toFixed(1)} hPa` : "N/A",
        }
      : undefined,
    showPerformanceMetrics: Boolean(stats),
    route: route.length ? route : fallbackRoute,
    reports: trip.reports?.map((report) => ({
      reportId: report.reportId,
      position: report.position,
      obstacleType: report.obstacleType,
      pathStatus: report.pathStatus,
    })),
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingBottom: verticalScale(24),
  },
  list: {
    flex: 1,
  },
  listHeader: {
    marginHorizontal: -scale(16),
  },
  headerSpacer: {
    height: verticalScale(12),
    backgroundColor: "transparent",
  },
  firstCardWrapper: {
    marginTop: -verticalScale(48),
  },
  emptyState: {
    paddingVertical: verticalScale(32),
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
})
