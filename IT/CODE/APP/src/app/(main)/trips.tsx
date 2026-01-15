import React, { useMemo, useState } from "react"
import { View, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
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
      } catch (error) {
        const message = getApiErrorMessage(error, "Unable to load your trips. Please try again.")
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
  const route = [
    { latitude: trip.origin.lat, longitude: trip.origin.lng },
    { latitude: trip.destination.lat, longitude: trip.destination.lng },
  ]

  const statistics = trip.statistics

  return {
    id: trip.tripId,
    name: "Trip",
    description: undefined,
    distanceKm: statistics?.distance ?? 0,
    durationMin: statistics?.time ?? 0,
    date: formatDate(trip.startedAt ?? trip.createdAt),
    avgSpeed: statistics?.speed ?? 0,
    maxSpeed: statistics?.maxSpeed ?? 0,
    elevation: 0,
    showWeatherBadge: false,
    showPerformanceMetrics: Boolean(statistics),
    route,
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "00/00/00"
  }
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
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
})
