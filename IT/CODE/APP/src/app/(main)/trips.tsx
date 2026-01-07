import React, { useMemo, useState } from "react"
import { View, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
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

const MOCK_TRIPS: RouteItem[] = [
  {
    id: "1",
    name: "Central Park Loop",
    distanceKm: 5.2,
    durationMin: 24,
    date: "01/12/25",
    avgSpeed: 13.2,
    maxSpeed: 22.6,
    elevation: 48,
    temperatureLabel: "17°",
    weather: {
      condition: "Clear Skies",
      windSpeed: "8 km/h",
      humidity: "58%",
      visibility: "12 km",
      pressure: "1015 hPa",
    },
    route: [
      { latitude: 45.4786, longitude: 9.2272 },
      { latitude: 45.4794, longitude: 9.2308 },
      { latitude: 45.4771, longitude: 9.2333 },
      { latitude: 45.4756, longitude: 9.2295 },
      { latitude: 45.4768, longitude: 9.2268 },
      { latitude: 45.4786, longitude: 9.2272 },
    ],
  },
  {
    id: "2",
    name: "River Trail",
    distanceKm: 8.4,
    durationMin: 38,
    date: "28/11/25",
    avgSpeed: 12.1,
    maxSpeed: 25.4,
    elevation: 62,
    temperatureLabel: "15°",
    weather: {
      condition: "Breezy",
      windSpeed: "18 km/h",
      humidity: "70%",
      visibility: "9 km",
      pressure: "1010 hPa",
    },
    route: [
      { latitude: 45.1863, longitude: 9.1582 },
      { latitude: 45.1848, longitude: 9.1651 },
      { latitude: 45.1829, longitude: 9.1706 },
      { latitude: 45.1811, longitude: 9.1645 },
    ],
  },
  {
    id: "3",
    name: "Downtown Express",
    distanceKm: 3.1,
    durationMin: 16,
    date: "25/11/25",
    avgSpeed: 14.5,
    maxSpeed: 27.3,
    elevation: 35,
    temperatureLabel: "19°",
    weather: {
      condition: "Partly Cloudy",
      windSpeed: "10 km/h",
      humidity: "62%",
      visibility: "10 km",
      pressure: "1008 hPa",
    },
    route: [
      { latitude: 45.4642, longitude: 9.1900 },
      { latitude: 45.4660, longitude: 9.1940 },
      { latitude: 45.4682, longitude: 9.1912 },
    ],
  },
]


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

  const [trips, setTrips] = useState<RouteItem[]>(MOCK_TRIPS)
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null)
  const [isSortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [pendingDeleteTrip, setPendingDeleteTrip] = useState<RouteItem | null>(null)
  const lastScrollOffset = React.useRef(0)

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

  function handleConfirmDeleteTrip() {
    if (!pendingDeleteTrip) return
    setTrips((current) => current.filter((trip) => trip.id !== pendingDeleteTrip.id))
    setExpandedTripId((current) =>
      current === pendingDeleteTrip.id ? null : current
    )
    setPendingDeleteTrip(null)
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
          label: "Yes, Delete",
          variant: "destructive",
          onPress: handleConfirmDeleteTrip,
        }}
        secondaryButton={{
          label: "No, Cancel",
          variant: "secondary",
          onPress: handleCancelDeleteTrip,
        }}
      />
    </View>
  )
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
