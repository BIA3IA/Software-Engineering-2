import React from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import MapView, { Marker, Polyline, Circle } from "react-native-maps"
import { AlertTriangle, Navigation, MapPin, Plus } from "lucide-react-native"
import * as Location from "expo-location"

import { layoutStyles, scale, verticalScale, radius } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuthStore } from "@/auth/storage"
import { useLoginPrompt } from "@/hooks/useLoginPrompt"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AppTextInput } from "@/components/ui/AppTextInput"
import { SearchResultsSheet, type SearchResult } from "@/components/SearchResultsSheet"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"
import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { ReportIssueModal } from "@/components/ReportIssueModal"

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"
  const requireLogin = useLoginPrompt()
  const insets = useSafeAreaInsets()
  const { setHidden: setNavHidden } = useBottomNavVisibility()
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
    console.log("Create new path tapped")
  }

  function handleReportIssue() {
    if (isGuest) {
      requireLogin()
      return
    }
    setReportVisible(true)
  }

  // TODO When report submitted make a popup using the component already existing with a success message - it should be similar to the succcess when saving profile - green

  function handleFindPaths() {
    if (!startPoint.trim() || !destination.trim()) {
      return
    }
    setResultsVisible(true)
    setSelectedResult(null)
    setActiveTrip(null)
    setResults([
      {
        id: "central-loop",
        title: "Central Park Loop",
        description: "Scenic path through the park",
        route: alignRouteToOrigin(
          [
            { latitude: 45.4778, longitude: 9.2264 },
            { latitude: 45.4786, longitude: 9.2289 },
            { latitude: 45.4799, longitude: 9.2311 },
            { latitude: 45.4812, longitude: 9.2332 },
          ],
          userLocation
        ),
        tags: [
          { label: "5.2 km", color: palette.primarySoft, textColor: palette.primary },
          { label: "Optimal", color: palette.greenSoft, textColor: palette.green },
        ],
      },
      {
        id: "river-trail",
        title: "River Trail",
        description: "Riverside bike path with great views",
        route: alignRouteToOrigin(
          [
            { latitude: 45.4764, longitude: 9.2232 },
            { latitude: 45.4772, longitude: 9.2259 },
            { latitude: 45.4784, longitude: 9.2283 },
            { latitude: 45.4791, longitude: 9.2308 },
            { latitude: 45.4803, longitude: 9.2335 },
          ],
          userLocation
        ),
        tags: [
          { label: "8.4 km", color: palette.primarySoft, textColor: palette.primary },
          { label: "Maintenance", color: palette.orangeSoft, textColor: palette.orange },
          { label: "3 reports", color: palette.redSoft, textColor: palette.red },
        ],
      },
    ])
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
  }

  function handleSubmitReport(values: { condition: string; obstacle: string }) {
    console.log("Report issue", values)
    setReportVisible(false)
  }

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
          <Polyline coordinates={traversedRoute} strokeColor={palette.muted} strokeWidth={4} />
        )}
        {upcomingRoute.length > 1 && (
          <Polyline coordinates={upcomingRoute} strokeColor={palette.primaryDark} strokeWidth={4} />
        )}
        {startRoutePoint && (
          <Circle
            center={startRoutePoint}
            radius={18}
            strokeColor={palette.primary}
            fillColor={`${palette.primary}33`}
          />
        )}
        {destinationPoint && (
          <Marker
            coordinate={destinationPoint}
            title="Destination"
            pinColor={palette.primary}
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
                icon={<Navigation size={iconSizes.md} color={palette.textSecondary} />}
                returnKeyType="next"
              />
            </View>
            <View style={styles.inputWrapper}>
              <AppTextInput
                placeholder="Where to?"
                value={destination}
                onChangeText={setDestination}
                autoCapitalize="words"
                icon={<MapPin size={iconSizes.md} color={palette.textSecondary} />}
                returnKeyType="done"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.findButton,
                {
                  backgroundColor: palette.primary,
                  shadowColor: palette.border,
                },
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleFindPaths}
            >
              <Text style={[styles.findButtonText, { color: palette.textInverse }]}>
                Find Paths
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.fab,
              {
                backgroundColor: isGuest ? palette.mutedBg : palette.primary,
                opacity: isGuest ? 0.7 : 1,
                shadowColor: palette.border,
                bottom: verticalScale(90) + insets.bottom,
              },
            ]}
            onPress={handleCreatePath}
          >
            <Plus size={iconSizes.lg} color={isGuest ? palette.muted : palette.textInverse} strokeWidth={2} />
          </Pressable>

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
                backgroundColor: palette.destructive,
                shadowColor: palette.border,
                bottom: verticalScale(90) + insets.bottom,
              },
            ]}
            onPress={handleReportIssue}
          >
            <AlertTriangle size={iconSizes.lg} color={palette.textInverse} strokeWidth={2.2} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              {
                backgroundColor: palette.primary,
                bottom: insets.bottom + verticalScale(24),
                shadowColor: palette.border,
              },
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleCompleteTrip}
          >
            <Text style={[styles.completeButtonText, { color: palette.textInverse }]}>
              Complete Trip
            </Text>
          </Pressable>
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

function regionAroundPoint(point: LatLng, delta = 0.01) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }
}

function alignRouteToOrigin(template: LatLng[], origin?: LatLng | null) {
  if (!origin || !template.length) {
    return template
  }

  const deltaLat = origin.latitude - template[0].latitude
  const deltaLng = origin.longitude - template[0].longitude

  return template.map((point) => ({
    latitude: point.latitude + deltaLat,
    longitude: point.longitude + deltaLng,
  }))
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
    paddingVertical: verticalScale(12),
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: radius.lg,
    elevation: 6,
  },
  findButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
