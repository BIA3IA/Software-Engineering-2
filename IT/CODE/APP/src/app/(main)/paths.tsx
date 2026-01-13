import React, { useMemo, useState } from "react"
import { View, FlatList, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from "react-native"
import { useFocusEffect } from "expo-router"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { RouteCard, RouteItem } from "@/components/route/RouteCard"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { SelectionOverlay } from "@/components/ui/SelectionOverlay"
import { AppPopup } from "@/components/ui/AppPopup"
import { scale, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import { AlertTriangle, Trash2, Eye, EyeOff } from "lucide-react-native"
import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { changePathVisibilityApi, deletePathApi, getMyPathsApi, type UserPathSummary } from "@/api/paths"
import { getApiErrorMessage } from "@/utils/apiError"

type SortOption = "date" | "distance" | "alphabetical"

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "distance", label: "Distance" },
  { key: "alphabetical", label: "Alphabetical" },
]

export default function PathsScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const deleteIconSize = iconSizes.xl
  const visibilityIconSize = iconSizes.xl

  const [paths, setPaths] = useState<RouteItem[]>([])
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null)
  const [isSortMenuVisible, setSortMenuVisible] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>("date")
  const [pendingDeletePath, setPendingDeletePath] = useState<RouteItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [pendingVisibilityChange, setPendingVisibilityChange] = useState<{
    path: RouteItem
    target: "public" | "private"
  } | null>(null)
  const [errorPopup, setErrorPopup] = useState({
    visible: false,
    title: "",
    message: "",
  })
  const lastScrollOffset = React.useRef(0)

  const loadPaths = React.useCallback(() => {
    let isActive = true

    async function fetchPaths() {
      try {
        const response = await getMyPathsApi()
        console.log(response)
        if (!isActive) return
        setPaths(response.map(mapPathSummaryToRouteItem))
      } catch (error) {
        const message = getApiErrorMessage(error, "Unable to load your paths. Please try again.")
        setErrorPopup({
          visible: true,
          title: "Loading failed",
          message,
        })
      }
    }

    fetchPaths()

    return () => {
      isActive = false
    }
  }, [])

  const sortedPaths = useMemo(() => {
    const parseDate = (value: string) => {
      const [day, month, year] = value.split("/").map(Number)
      return new Date(2000 + year, (month ?? 1) - 1, day ?? 1).getTime()
    }

    return [...paths].sort((a, b) => {
      switch (sortOption) {
        case "distance":
          return b.distanceKm - a.distanceKm
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

  async function handleConfirmDeletePath() {
    if (!pendingDeletePath || isDeleting) return
    const pathId = pendingDeletePath.id
    setIsDeleting(true)
    try {
      await deletePathApi(pathId)
      setPaths((current) => current.filter((path) => path.id !== pathId))
      setExpandedPathId((current) => (current === pathId ? null : current))
      setPendingDeletePath(null)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to delete the path. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Delete failed",
        message,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancelDeletePath() {
    if (isDeleting) return
    setPendingDeletePath(null)
  }

  function handleVisibilityPress(path: RouteItem) {
    const target = path.visibility === "public" ? "private" : "public"
    setPendingVisibilityChange({ path, target })
  }

  async function handleConfirmVisibilityChange() {
    if (!pendingVisibilityChange || isUpdatingVisibility) return
    const pathId = pendingVisibilityChange.path.id
    const nextVisibility = pendingVisibilityChange.target === "public"
    setIsUpdatingVisibility(true)
    try {
      await changePathVisibilityApi(pathId, nextVisibility)
      setPaths((current) =>
        current.map((path) =>
          path.id === pathId ? { ...path, visibility: pendingVisibilityChange.target } : path
        )
      )
      setPendingVisibilityChange(null)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to change visibility. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Visibility update failed",
        message,
      })
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  function handleCancelVisibilityChange() {
    if (isUpdatingVisibility) return
    setPendingVisibilityChange(null)
  }

  function handleCloseErrorPopup() {
    setErrorPopup((prev) => ({
      ...prev,
      visible: false,
    }))
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

  useFocusEffect(loadPaths)

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
          label: isDeleting ? "Deleting..." : "Yes, Delete",
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
          label: isUpdatingVisibility ? "Updating..." : "Yes, Change",
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
      <AppPopup
        visible={errorPopup.visible}
        title={errorPopup.title || "Error"}
        message={errorPopup.message || "Unable to complete the request."}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleCloseErrorPopup}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: handleCloseErrorPopup,
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
      />
    </View>
  )
}

function mapPathSummaryToRouteItem(path: UserPathSummary): RouteItem {
  return {
    id: path.pathId,
    name: path.title || "Untitled Path",
    description: path.description ?? undefined,
    distanceKm: 0,
    durationMin: 0,
    date: formatDate(path.createdAt),
    avgSpeed: 0,
    maxSpeed: 0,
    elevation: 0,
    visibility: path.visibility ? "public" : "private",
    showWeatherBadge: false,
    showPerformanceMetrics: false,
    route: [
      { latitude: path.origin.lat, longitude: path.origin.lng },
      { latitude: path.destination.lat, longitude: path.destination.lng },
    ],
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
