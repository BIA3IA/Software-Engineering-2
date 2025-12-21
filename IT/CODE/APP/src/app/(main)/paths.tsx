import React, { useMemo, useState } from "react"
import { View, FlatList, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { RouteCard, RouteItem } from "@/components/route/RouteCard"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { AppPopup } from "@/components/ui/AppPopup"
import { scale, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import { Trash2, Eye, EyeOff } from "lucide-react-native"
import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"

const MOCK_PATHS: RouteItem[] = [
  {
    id: "p1",
    name: "Sunset Coastal Route",
    description: "A scenic path along the coast with gentle turns and sea breeze.",
    distanceKm: 12.3,
    durationMin: 55,
    date: "05/05/25",
    avgSpeed: 14.1,
    maxSpeed: 26.4,
    elevation: 120,
    visibility: "public",
    actionLabel: "Start Trip",
    showWeatherBadge: false,
    showPerformanceMetrics: false,
    route: [
      { latitude: 45.421, longitude: 9.18 },
      { latitude: 45.425, longitude: 9.185 },
      { latitude: 45.428, longitude: 9.192 },
    ],
  },
  {
    id: "p2",
    name: "Forest Discovery",
    description: "Immersive ride through dense woods with moderate climbs.",
    distanceKm: 18.7,
    durationMin: 82,
    date: "02/05/25",
    avgSpeed: 13.5,
    maxSpeed: 28.1,
    elevation: 210,
    visibility: "private",
    actionLabel: "Resume Planning",
    showWeatherBadge: false,
    showPerformanceMetrics: false,
    route: [
      { latitude: 45.36, longitude: 9.12 },
      { latitude: 45.365, longitude: 9.13 },
      { latitude: 45.37, longitude: 9.125 },
    ],
  },
  {
    id: "p3",
    name: "City Highlights Loop",
    description: "Urban exploration touching major landmarks and cafes.",
    distanceKm: 9.5,
    durationMin: 42,
    date: "30/04/25",
    avgSpeed: 15.2,
    maxSpeed: 29.8,
    elevation: 60,
    visibility: "public",
    actionLabel: "Preview Route",
    showWeatherBadge: false,
    showPerformanceMetrics: false,
    route: [
      { latitude: 45.48, longitude: 9.20 },
      { latitude: 45.482, longitude: 9.206 },
      { latitude: 45.485, longitude: 9.198 },
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

export default function PathsScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const deleteIconSize = iconSizes.xl
  const visibilityIconSize = iconSizes.xl

  const [paths, setPaths] = useState<RouteItem[]>(MOCK_PATHS)
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null)
  const [isSortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [pendingDeletePath, setPendingDeletePath] = useState<RouteItem | null>(null)
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<{
    path: RouteItem
    target: "public" | "private"
  } | null>(null)
  const lastScrollOffset = React.useRef(0)

  const sortedPaths = useMemo(() => {
    const parseDate = (value: string) => {
      const [day, month, year] = value.split("/").map(Number)
      return new Date(2000 + year, (month ?? 1) - 1, day ?? 1).getTime()
    }

    return [...paths].sort((a, b) => {
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
  }, [sortOption, paths])

  function handleTogglePath(id: string) {
    setExpandedPathId((current) => (current === id ? null : id))
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

  function handleRequestDeletePath(path: RouteItem) {
    setPendingDeletePath(path)
  }

  function handleConfirmDeletePath() {
    if (!pendingDeletePath) return
    setPaths((current) => current.filter((path) => path.id !== pendingDeletePath.id))
    setExpandedPathId((current) =>
      current === pendingDeletePath.id ? null : current
    )
    setPendingDeletePath(null)
  }

  function handleCancelDeletePath() {
    setPendingDeletePath(null)
  }

  function handleVisibilityPress(path: RouteItem) {
    const target = path.visibility === "public" ? "private" : "public"
    setPendingVisibilityChange({ path, target })
  }

  function handleConfirmVisibilityChange() {
    if (!pendingVisibilityChange) return

    setPaths((current) =>
      current.map((path) =>
        path.id === pendingVisibilityChange.path.id
          ? { ...path, visibility: pendingVisibilityChange.target }
          : path
      )
    )
    setPendingVisibilityChange(null)
  }

  function handleCancelVisibilityChange() {
    setPendingVisibilityChange(null)
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

  const visibilityChangeMessage = pendingVisibilityChange
    ? pendingVisibilityChange.target === "private"
      ? "Do you want to make this path private? Only you will be able to see it."
      : "Do you want to make this path public? Everybody will be able to see it."
    : ""

  const visibilityIconColor =
    pendingVisibilityChange?.target === "private" ? palette.surface.muted : palette.accent.green.base

  const visibilityIconBackground =
    pendingVisibilityChange?.target === "private"
      ? `${palette.border.default}`
      : `${palette.accent.green.surface}`

  const visibilityPrimaryButtonColor = visibilityIconColor
  const visibilityPrimaryTextColor = palette.text.onAccent

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.screen }]}>
      <FlatList
        style={styles.list}
        data={sortedPaths}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: scale(16) },
        ]}
        renderItem={({ item, index }) => (
          <View style={index === 0 ? styles.firstCardWrapper : undefined}>
            <RouteCard
              trip={item}
              isExpanded={expandedPathId === item.id}
              onToggle={() => handleTogglePath(item.id)}
              onDeletePress={() => handleRequestDeletePath(item)}
              onVisibilityPress={() => handleVisibilityPress(item)}
              mapTitle="Path Map"
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <ScreenHeader
              title="Paths Library"
              subtitle="Browse and manage your paths"
              onSortPress={handleSortPress}
            />
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
        visible={Boolean(pendingDeletePath)}
        title="Delete Path?"
        message="Are you sure you want to delete this path? This action cannot be undone."
        icon={<Trash2 size={deleteIconSize} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleCancelDeletePath}
        primaryButton={{
          label: "Yes, Delete",
          variant: "destructive",
          onPress: handleConfirmDeletePath,
        }}
        secondaryButton={{
          label: "No, Cancel",
          variant: "secondary",
          onPress: handleCancelDeletePath,
        }}
      />

      <AppPopup
        visible={Boolean(pendingVisibilityChange)}
        title="Change Visibility?"
        message={visibilityChangeMessage}
        icon={
          pendingVisibilityChange?.target === "private" ? (
            <EyeOff size={visibilityIconSize} color={visibilityIconColor} />
          ) : (
            <Eye size={visibilityIconSize} color={visibilityIconColor} />
          )
        }
        iconBackgroundColor={visibilityIconBackground}
        onClose={handleCancelVisibilityChange}
        primaryButton={{
          label: "Yes, Change",
          variant: "primary",
          onPress: handleConfirmVisibilityChange,
          buttonColor: visibilityPrimaryButtonColor,
          textColor: visibilityPrimaryTextColor,
        }}
        secondaryButton={{
          label: "No, Cancel",
          variant: "secondary",
          onPress: handleCancelVisibilityChange,
          textColor: visibilityIconColor,
          borderColor: visibilityIconColor,
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
