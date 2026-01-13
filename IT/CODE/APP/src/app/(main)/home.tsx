import React from "react"
import { View, StyleSheet, Pressable } from "react-native"
import MapView, { Marker, Polyline, Circle } from "react-native-maps"
import { AlertTriangle, Navigation, MapPin, Plus, CheckCircle } from "lucide-react-native"
import * as Location from "expo-location"

import { layoutStyles, scale, verticalScale, radius } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuthStore } from "@/auth/storage"
import { useLoginPrompt } from "@/hooks/useLoginPrompt"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppTextInput } from "@/components/ui/AppTextInput"
import { SearchResultsSheet, type SearchResult } from "@/components/paths/SearchResultsSheet"
import { CreatePathModal } from "@/components/modals/CreatePathModal"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"
import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { ReportIssueModal } from "@/components/modals/ReportIssueModal"
import { AppPopup } from "@/components/ui/AppPopup"
import { AppButton } from "@/components/ui/AppButton"
import { useRouter } from "expo-router"
import { usePrivacyPreference } from "@/hooks/usePrivacyPreference"
import { type PrivacyPreference } from "@/constants/Privacy"
import { geocodeAddress } from "@/api/geocoding"
import { searchPathsApi, type UserPathSummary } from "@/api/paths"
import { getApiErrorMessage } from "@/utils/apiError"

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"
  const router = useRouter()
  const requireLogin = useLoginPrompt()
  const insets = useSafeAreaInsets()
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const defaultVisibility = usePrivacyPreference()
  const [startPoint, setStartPoint] = React.useState("")
  const [destination, setDestination] = React.useState("")
  const [resultsVisible, setResultsVisible] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(null)
  const [activeTrip, setActiveTrip] = React.useState<SearchResult | null>(null)
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null)
  const [userHeading, setUserHeading] = React.useState<number | null>(null)
  const mapRef = React.useRef<MapView | null>(null)
  const locationWatcherRef = React.useRef<Location.LocationSubscription | null>(null)
  const [reportVisible, setReportVisible] = React.useState(false)
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
  const [isCompletedPopupVisible, setCompletedPopupVisible] = React.useState(false)
  const [isCreateModalVisible, setCreateModalVisible] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [errorPopup, setErrorPopup] = React.useState({
    visible: false,
    title: "",
    message: "",
  })

  const successTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayRoute = (activeTrip?.route ?? selectedResult?.route) ?? []
  const destinationPoint = displayRoute[displayRoute.length - 1]
  const startRoutePoint = displayRoute[0]
  const hasActiveNavigation = Boolean(activeTrip && activeTrip.route.length > 0)

  const routeProgressIndex = React.useMemo(() => {
    if (!activeTrip || !userLocation) return null
    return findClosestPointIndex(activeTrip.route, userLocation)
  }, [activeTrip, userLocation])

  const traversedRoute = React.useMemo(() => {
    if (!activeTrip || routeProgressIndex === null || routeProgressIndex < 1) {
      return []
    }
    return activeTrip.route.slice(0, routeProgressIndex + 1)
  }, [activeTrip, routeProgressIndex])

  const upcomingRoute = React.useMemo(() => {
    if (activeTrip && routeProgressIndex !== null && routeProgressIndex >= 0) {
      return activeTrip.route.slice(Math.max(routeProgressIndex, 0))
    }
    return displayRoute
  }, [activeTrip, routeProgressIndex, displayRoute])

  function handleCreatePath() {
    if (isGuest) {
      requireLogin()
      return
    }
    setCreateModalVisible(true)
  }

  function handleStartCreating(values: { name: string; description: string; visibility: PrivacyPreference }) {
    setCreateModalVisible(false)
    const query = `?name=${encodeURIComponent(values.name)}&description=${encodeURIComponent(values.description)}&visibility=${values.visibility}`
    router.push(`/create-path${query}` as any)
  }

  function handleReportIssue() {
    if (isGuest) {
      requireLogin()
      return
    }
    setReportVisible(true)
  }

  async function handleFindPaths() {
    if (!startPoint.trim() || !destination.trim() || isSearching) {
      return
    }
    setIsSearching(true)
    setResultsVisible(false)
    setSelectedResult(null)
    setActiveTrip(null)

    try {
      const [origin, dest] = await Promise.all([
        geocodeAddress(startPoint),
        geocodeAddress(destination),
      ])

      if (!origin || !dest) {
        setErrorPopup({
          visible: true,
          title: "Location not found",
          message: "Please check the address and try again.",
        })
        setResults([])
        setResultsVisible(false)
        return
      }

      const response = await searchPathsApi({
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
      })
      setResults(response.map((path) => mapSearchPathToResult(path, palette)))
      setResultsVisible(true)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to search paths. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Search Error",
        message,
      })
      setResults([])
      setResultsVisible(false)
    } finally {
      setIsSearching(false)
    }
  }

  function handleSelectResult(result: SearchResult) {
    setSelectedResult(result)
    setActiveTrip(null)
  }

  function handleStartTrip(result: SearchResult) {
    setSelectedResult(result)
    setActiveTrip(result)
    setResultsVisible(false)
    console.log("Start trip for", result.id)
  }

  function handleCompleteTrip() {
    if (activeTrip) {
      console.log("Trip completed", activeTrip.id)
    }
    setActiveTrip(null)
    setSelectedResult(null)
    setReportVisible(false)
    setCompletedPopupVisible(true)
  }

  function go(to: string) {
    router.replace(to as any)
  }

  function handleSubmitReport(values: { condition: string; obstacle: string }) {
    console.log("Report issue", values)
    setReportVisible(false)
    setSuccessPopupVisible(true)

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
    }

    successTimerRef.current = setTimeout(() => {
      setSuccessPopupVisible(false)
    }, 2500)
  }

  function handleCloseErrorPopup() {
    setErrorPopup((prev) => ({
      ...prev,
      visible: false,
    }))
  }

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])


  React.useEffect(() => {
    let cancelled = false
    let watcher: Location.LocationSubscription | null = null
    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          return
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        })
        if (cancelled) return
        setUserLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        })
        if (current.coords.heading != null && Number.isFinite(current.coords.heading) && current.coords.heading >= 0) {
          setUserHeading(current.coords.heading)
        }

        try {
          const reverse = await Location.reverseGeocodeAsync({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          })
          if (cancelled) return
          const formatted = formatAddress(reverse[0])
          if (formatted) {
            setStartPoint((prev) => (prev.trim().length ? prev : formatted))
          }
        } catch (geoError) {
          console.warn("Failed to reverse geocode", geoError)
        }

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.LocationAccuracy.Balanced,
            distanceInterval: 5,
          },
          (location) => {
            if (cancelled) return
            setUserLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
            if (location.coords.heading != null && Number.isFinite(location.coords.heading) && location.coords.heading >= 0) {
              setUserHeading(location.coords.heading)
            }
          }
        )
        locationWatcherRef.current = watcher
      } catch (error) {
        console.warn("Failed to fetch location", error)
      }
    }
    fetchLocation()
    return () => {
      cancelled = true
      if (watcher) {
        watcher.remove()
      }
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove()
        locationWatcherRef.current = null
      }
    }
  }, [])

  React.useEffect(() => {
    setNavHidden(hasActiveNavigation)
    return () => {
      setNavHidden(false)
    }
  }, [hasActiveNavigation, setNavHidden])

  React.useEffect(() => {
    if (!mapRef.current) return

    if (hasActiveNavigation && userLocation) {
      requestAnimationFrame(() => {
        mapRef.current?.animateCamera(
          {
            center: userLocation,
            heading: userHeading ?? 0,
            pitch: 20,
            zoom: 18,
            altitude: 500,
          },
          { duration: 350 }
        )
      })
      return
    }

    if (displayRoute.length) {
      const region = regionCenteredOnDestination(displayRoute)
      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(region, 600)
      })
      return
    }

    if (userLocation) {
      const region = regionAroundPoint(userLocation, 0.008)
      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(region, 600)
      })
    }
  }, [selectedResult?.id, displayRoute, userLocation, hasActiveNavigation, userHeading])

  return (
    <>
      <View style={layoutStyles.screen}>
        <MapView
          ref={(ref) => {
            mapRef.current = ref
          }}
          style={styles.map}
          initialRegion={{
            latitude: 45.478,
            longitude: 9.227,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          customMapStyle={scheme === "dark" ? darkMapStyle : lightMapStyle}
          showsCompass={false}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {hasActiveNavigation && traversedRoute.length > 1 && (
            <Polyline coordinates={traversedRoute} strokeColor={palette.border.default} strokeWidth={4} />
          )}
          {upcomingRoute.length > 1 && (
            <Polyline coordinates={upcomingRoute} strokeColor={palette.brand.dark} strokeWidth={4} />
          )}
          {startRoutePoint && (
            <Circle
              center={startRoutePoint}
              radius={18}
              strokeColor={palette.brand.base}
              fillColor={`${palette.brand.base}33`}
            />
          )}
          {destinationPoint && (
            <Marker
              coordinate={destinationPoint}
              title="Destination"
              pinColor={palette.brand.base}
            />
          )}
        </MapView>

        {!hasActiveNavigation && (
          <>
            <View
              style={[
                styles.searchContainer,
                {
                  top: insets.top + verticalScale(16),
                },
              ]}
            >
              <View style={styles.inputWrapper}>
                <AppTextInput
                  placeholder="Starting point"
                  value={startPoint}
                  onChangeText={setStartPoint}
                  autoCapitalize="words"
                  icon={<Navigation size={iconSizes.md} color={palette.text.secondary} />}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.inputWrapper}>
                <AppTextInput
                  placeholder="Where to?"
                  value={destination}
                  onChangeText={setDestination}
                  autoCapitalize="words"
                  icon={<MapPin size={iconSizes.md} color={palette.text.secondary} />}
                  returnKeyType="done"
                />
              </View>

              <AppButton
                title={isSearching ? "Searching..." : "Find Paths"}
                onPress={handleFindPaths}
                buttonColor={palette.brand.base}
                style={[
                  styles.findButton,
                  {
                    shadowColor: palette.border.muted,
                  },
                ]}
              />
            </View>

            {!isGuest && (
              <Pressable
                style={[
                  styles.fab,
                  {
                    backgroundColor: palette.button.primary.bg,
                    shadowColor: palette.border.muted,
                    bottom: verticalScale(90) + insets.bottom,
                  },
                ]}
                onPress={handleCreatePath}
              >
                <Plus size={iconSizes.lg} color={palette.text.onAccent} strokeWidth={2} />
              </Pressable>
            )}

            <SearchResultsSheet
              visible={resultsVisible}
              results={results}
              topOffset={insets.top + verticalScale(16)}
              onClose={() => setResultsVisible(false)}
              selectedResultId={selectedResult?.id ?? null}
              onSelectResult={handleSelectResult}
              onActionPress={handleStartTrip}
            />
          </>
        )}

        {hasActiveNavigation && (
          <>
            <Pressable
              style={[
                styles.fab,
                {
                  backgroundColor: palette.status.danger,
                  shadowColor: palette.border.muted,
                  bottom: verticalScale(90) + insets.bottom,
                },
              ]}
              onPress={handleReportIssue}
            >
              <AlertTriangle size={iconSizes.lg} color={palette.text.onAccent} strokeWidth={2.2} />
            </Pressable>

            <AppButton
              title="Complete Trip"
              onPress={handleCompleteTrip}
              buttonColor={palette.brand.base}
              style={[
                styles.completeButton,
                {
                  bottom: insets.bottom + verticalScale(24),
                  shadowColor: palette.border.muted,
                },
              ]}
            />
          </>
        )}
      </View>
      <ReportIssueModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={handleSubmitReport}
        conditionOptions={ISSUE_CONDITION_OPTIONS}
        obstacleOptions={OBSTACLE_TYPE_OPTIONS}
      />

      <AppPopup
        visible={isSuccessPopupVisible}
        title="Report Submitted"
        message="Thank you for helping keep our cycling community safe and informed."
        icon={<CheckCircle size={iconSizes.xl} color={palette.status.success} />}
        iconBackgroundColor={`${palette.accent.green.surface}`}
        onClose={() => setSuccessPopupVisible(false)}
        primaryButton={{
          label: "Great!",
          variant: "primary",
          onPress: () => setSuccessPopupVisible(false),
          buttonColor: palette.status.success,
          textColor: palette.text.onAccent,
        }}
      />

      <AppPopup
        visible={isCompletedPopupVisible}
        title={isGuest ? "Trip Completed" : "Great Ride!"}
        message={isGuest ? "Log in to save your trip stats and track your progress." : "Your trip has been saved to your profile successfully."}
        icon={<CheckCircle size={iconSizes.xl} color={palette.status.success} />}
        iconBackgroundColor={`${palette.accent.green.surface}`}
        onClose={() => setCompletedPopupVisible(false)}
        primaryButton={{
          label: isGuest ? "Log In" : "View Stats",
          variant: "primary",
          onPress: () => { isGuest ? go("/(auth)/login") : go("/trips") },
          buttonColor: palette.status.success,
          textColor: palette.text.onAccent,
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
      <CreatePathModal
        visible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleStartCreating}
        initialVisibility={defaultVisibility}
      />
    </>
  )
}

function regionCenteredOnDestination(route: LatLng[]) {
  if (!route.length) {
    return {
      latitude: 45.478,
      longitude: 9.227,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
  }

  const destination = route[route.length - 1]
  let minLat = route[0].latitude
  let maxLat = route[0].latitude
  let minLng = route[0].longitude
  let maxLng = route[0].longitude

  for (const point of route) {
    minLat = Math.min(minLat, point.latitude)
    maxLat = Math.max(maxLat, point.latitude)
    minLng = Math.min(minLng, point.longitude)
    maxLng = Math.max(maxLng, point.longitude)
  }

  const latDelta = Math.max(0.01, (maxLat - minLat) * 2.4)
  const lngDelta = Math.max(0.01, (maxLng - minLng) * 2.4)

  return {
    latitude: destination.latitude,
    longitude: destination.longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  }
}

type LatLng = { latitude: number; longitude: number }
type ThemePalette = typeof Colors.light

function regionAroundPoint(point: LatLng, delta = 0.01) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }
}

function formatAddress(address?: Location.LocationGeocodedAddress) {
  if (!address) return ""
  const streetLine = [address.street ?? address.name, address.streetNumber]
    .filter((part) => part && part.toString().trim().length)
    .join(" ")
    .trim()
  const locality = address.city ?? address.subregion ?? address.region ?? ""
  const components = [streetLine, locality].filter((part) => part && part.trim().length)
  return components.join(", ")
}

function mapSearchPathToResult(path: UserPathSummary, palette: ThemePalette): SearchResult {
  const tags: SearchResult["tags"] = []
  const statusTag = buildStatusTag(path.status, palette)
  if (statusTag) {
    tags.push(statusTag)
  }

  return {
    id: path.pathId,
    title: path.title || "Untitled Path",
    description: path.description?.trim() ? path.description : "No description available.",
    tags,
    route: [
      { latitude: path.origin.lat, longitude: path.origin.lng },
      { latitude: path.destination.lat, longitude: path.destination.lng },
    ],
  }
}

function buildStatusTag(
  status: string | null | undefined,
  palette: ThemePalette
): SearchResult["tags"][number] | null {
  if (!status) return null
  const normalized = status.toUpperCase()

  if (normalized === "OPTIMAL") {
    return { label: "Optimal", color: palette.accent.green.surface, textColor: palette.accent.green.base }
  }
  if (normalized === "MEDIUM") {
    return { label: "Medium", color: palette.accent.blue.surface, textColor: palette.accent.blue.base }
  }
  if (normalized === "SUFFICIENT") {
    return { label: "Sufficient", color: palette.accent.orange.surface, textColor: palette.accent.orange.base }
  }
  if (normalized === "REQUIRES_MAINTENANCE") {
    return { label: "Maintenance", color: palette.accent.red.surface, textColor: palette.accent.red.base }
  }

  return null
}

function findClosestPointIndex(route: LatLng[], position: LatLng) {
  if (!route.length) return 0
  let minIndex = 0
  let minDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < route.length; i++) {
    const point = route[i]
    const distance = Math.hypot(point.latitude - position.latitude, point.longitude - position.longitude)
    if (distance < minDistance) {
      minDistance = distance
      minIndex = i
    }
  }

  return minIndex
}

const ISSUE_CONDITION_OPTIONS = [
  // { key: "OPTIMAL", label: "Optimal" },
  { key: "MEDIUM", label: "Medium" },
  { key: "SUFFICIENT", label: "Sufficient" },
  { key: "REQUIRES_MAINTENANCE", label: "Requires Maintenance" },
  { key: "CLOSED", label: "Closed" },
]

const OBSTACLE_TYPE_OPTIONS = [
  { key: "POTHOLE", label: "Pothole" },
  { key: "WORK_IN_PROGRESS", label: "Work in Progress" },
  { key: "FLOODING", label: "Flooding" },
  { key: "OBSTACLE", label: "Obstacle" },
  { key: "OTHER", label: "Other" },
]

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  searchContainer: {
    position: "absolute",
    width: "86%",
    alignSelf: "center",
    gap: verticalScale(10),
    zIndex: 10,
  },
  inputWrapper: {
    width: "100%",
  },
  findButton: {
    marginTop: verticalScale(4),
    borderRadius: radius.full,
    width: "100%",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: radius.lg,
    elevation: 6,
  },
  fab: {
    position: "absolute",
    right: scale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 8,
    opacity: 0.85,
  },
  completeButton: {
    position: "absolute",
    alignSelf: "center",
    width: "80%",
    borderRadius: radius.full,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
})
