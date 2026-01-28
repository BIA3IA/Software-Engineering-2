import React from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import MapView, { Marker, Polyline, Circle } from "react-native-maps"
import { AlertTriangle, Navigation, MapPin, Plus, CheckCircle, X, Bike } from "lucide-react-native"
import * as Location from "expo-location"

import { layoutStyles, scale, verticalScale, radius } from "@/theme/layout"
import { iconSizes, textStyles } from "@/theme/typography"
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
import { MapIconMarker } from "@/components/ui/MapIconMarker"
import { useRouter } from "expo-router"
import { usePrivacyPreference } from "@/hooks/usePrivacyPreference"
import { type PrivacyPreference } from "@/constants/Privacy"
import { searchPathsApi } from "@/api/paths"
import { createTripApi } from "@/api/trips"
import { attachReportsToTripApi, confirmReportApi, createReportApi, getReportsByPathApi, type ReportSummary } from "@/api/reports"
import { getApiErrorMessage } from "@/utils/apiError"
import { useTripLaunchSelection, useSetTripLaunchSelection } from "@/hooks/useTripLaunchSelection"
import { buildRouteFromLatLngSegments } from "@/utils/routes"
import { mapUserPathSummaryToSearchResult } from "@/utils/pathMappers"
import { findClosestPointIndex, normalizeSearchResult, regionAroundPoint, regionCenteredOnDestination } from "@/utils/map"
import { haversineDistanceMetersLatLng, isNearOrigin, minDistanceToRouteMeters } from "@/utils/geo"
import { getConditionLabel, getObstacleLabel } from "@/utils/reportOptions"

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
  const tripLaunchSelection = useTripLaunchSelection()
  const setTripLaunchSelection = useSetTripLaunchSelection()
  const [startPoint, setStartPoint] = React.useState("")
  const [destination, setDestination] = React.useState("")
  const [resultsVisible, setResultsVisible] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [reportsByPathId, setReportsByPathId] = React.useState<Record<string, ReportSummary[]>>({})
  const [selectedResult, setSelectedResult] = React.useState<SearchResult | null>(null)
  const [activeTrip, setActiveTrip] = React.useState<SearchResult | null>(null)
  const [activeTripStartedAt, setActiveTripStartedAt] = React.useState<Date | null>(null)
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null)
  const [userHeading, setUserHeading] = React.useState<number | null>(null)
  const mapRef = React.useRef<MapView | null>(null)
  const locationWatcherRef = React.useRef<Location.LocationSubscription | null>(null)
  const [reportVisible, setReportVisible] = React.useState(false)
  const [reportConfirmation, setReportConfirmation] = React.useState<ReportSummary | null>(null)
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
  const [isCompletedPopupVisible, setCompletedPopupVisible] = React.useState(false)
  const [isCreateModalVisible, setCreateModalVisible] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [isCancelTripPopupVisible, setCancelTripPopupVisible] = React.useState(false)
  const [isOffRoutePopupVisible, setOffRoutePopupVisible] = React.useState(false)
  const [errorPopup, setErrorPopup] = React.useState({
    visible: false,
    title: "",
    message: "",
  })

  const START_TRIP_DISTANCE_METERS = 20
  const OFF_ROUTE_DISTANCE_METERS = 20
  const OFF_ROUTE_MAX_CONSECUTIVE = 3
  const OFF_ROUTE_MAX_MS = 15000
  const REPORT_CONFIRM_DISTANCE_METERS = 15
  const REPORT_CONFIRM_DISMISS_MS = 8000
  const AUTO_COMPLETE_DISTANCE_METERS = 10

  const successTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const offRouteCountRef = React.useRef(0)
  const offRouteStartedAtRef = React.useRef<number | null>(null)
  const offRouteContinueUsedRef = React.useRef(false)
  const reportSessionIdRef = React.useRef<string | null>(null)
  const confirmationTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptedReportIdsRef = React.useRef(new Set<string>())
  const autoCompleteTriggeredRef = React.useRef(false)

  const displayRoute = (activeTrip?.route ?? selectedResult?.route) ?? []
  const destinationPoint = displayRoute[displayRoute.length - 1]
  const startRoutePoint = displayRoute[0]
  const hasActiveNavigation = Boolean(activeTrip && activeTrip.route.length > 0)
  const canStartSelectedTrip =
    !activeTrip &&
    Boolean(
      selectedResult &&
        userLocation &&
        startRoutePoint &&
        isNearOrigin(
          { lat: startRoutePoint.latitude, lng: startRoutePoint.longitude },
          userLocation,
          START_TRIP_DISTANCE_METERS
        )
    )
  const canContinueOffRoute = !offRouteContinueUsedRef.current
  const offRouteMessage = canContinueOffRoute
    ? "You are too far from the path. End the trip?"
    : "You are too far from the path and have already continued once. End the trip?"

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
    const originQuery = startPoint.trim()
    const destinationQuery = destination.trim()
    setIsSearching(true)
    setResultsVisible(false)
    setSelectedResult(null)
    setActiveTrip(null)

    try {
      const response = await searchPathsApi({
        origin: originQuery,
        destination: destinationQuery,
      })
      setResults(response.map((path) => mapUserPathSummaryToSearchResult(path, palette)))
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
    const normalized = normalizeSearchResult(result, buildRouteFromLatLngSegments)
    setSelectedResult(normalized)
    setActiveTrip(null)
    setActiveTripStartedAt(null)
    void loadReportsForPath(normalized.id)
  }

  async function handleStartTrip(result: SearchResult) {
    const normalized = normalizeSearchResult(result, buildRouteFromLatLngSegments)
    setSelectedResult(normalized)
    setActiveTrip(normalized)
    setActiveTripStartedAt(new Date())
    if (!reportSessionIdRef.current) {
      reportSessionIdRef.current = generateSessionId()
    }
    resetOffRouteTracking()
    offRouteContinueUsedRef.current = false
    setOffRoutePopupVisible(false)
    setResultsVisible(false)
    if (isGuest) {
      return
    }
  }

  function handleCloseResults() {
    setResultsVisible(false)
    setSelectedResult(null)
    setActiveTrip(null)
    setActiveTripStartedAt(null)
  }

  function handleCancelTrip() {
    setCancelTripPopupVisible(true)
  }

  function handleConfirmCancelTrip() {
    resetOffRouteTracking()
    offRouteContinueUsedRef.current = false
    setActiveTrip(null)
    setSelectedResult(null)
    setActiveTripStartedAt(null)
    setReportVisible(false)
    reportSessionIdRef.current = null
    autoCompleteTriggeredRef.current = false
    setResultsVisible(false)
    setCancelTripPopupVisible(false)
  }

  function handleCloseCancelTripPopup() {
    setCancelTripPopupVisible(false)
  }

  function resetOffRouteTracking() {
    offRouteCountRef.current = 0
    offRouteStartedAtRef.current = null
  }

  function handleContinueOffRoute() {
    if (offRouteContinueUsedRef.current) {
      handleEndOffRouteTrip()
      return
    }
    offRouteContinueUsedRef.current = true
    resetOffRouteTracking()
    setOffRoutePopupVisible(false)
  }

  function handleEndOffRouteTrip() {
    setOffRoutePopupVisible(false)
    void handleCompleteTrip()
  }

  async function handleCompleteTrip() {
    if (!activeTrip) {
      return
    }

    if (!isGuest) {
      if (!activeTripStartedAt || !startRoutePoint || !destinationPoint) {
        setErrorPopup({
          visible: true,
          title: "Trip Error",
          message: "Trip details are missing. Please try again.",
        })
        return
      }

      const tripSegments = buildTraversedTripSegments(
        activeTrip.pathSegments ?? [],
        traversedRoute.length
      )

      const hasInvalidSegment = tripSegments.some((segment) => segment.polylineCoordinates.length < 2)

      if (!tripSegments.length || hasInvalidSegment) {
        setErrorPopup({
          visible: true,
          title: "Trip Error",
          message: "Trip too short to be saved. Please ride a bit longer and try again.",
        })
        return
      }

      try {
        const tripId = await createTripApi({
          origin: { lat: startRoutePoint.latitude, lng: startRoutePoint.longitude },
          destination: { lat: destinationPoint.latitude, lng: destinationPoint.longitude },
          startedAt: activeTripStartedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          title: activeTrip.title,
          tripSegments,
        })

        if (reportSessionIdRef.current) {
          try {
            await attachReportsToTripApi({
              sessionId: reportSessionIdRef.current,
              tripId,
            })
          } catch (error) {
            const message = getApiErrorMessage(
              error,
              "Unable to attach reports to the trip. Please try again."
            )
            setErrorPopup({
              visible: true,
              title: "Trip Error",
              message,
            })
          }
        }
      } catch (error) {
        const message = getApiErrorMessage(error, "Unable to save the trip. Please try again.")
        setErrorPopup({
          visible: true,
          title: "Trip Error",
          message,
        })
        return
      }
    }

    resetOffRouteTracking()
    offRouteContinueUsedRef.current = false
    setActiveTrip(null)
    setSelectedResult(null)
    setActiveTripStartedAt(null)
    setReportVisible(false)
    reportSessionIdRef.current = null
    autoCompleteTriggeredRef.current = false
    setCompletedPopupVisible(true)
  }

  function go(to: string) {
    router.replace(to as any)
  }

  async function handleSubmitReport(values: { condition: string; obstacle: string }) {
    if (!activeTrip || !userLocation) {
      setErrorPopup({
        visible: true,
        title: "Report Error",
        message: "Trip details are missing. Please try again.",
      })
      return
    }

    const sessionId = reportSessionIdRef.current ?? generateSessionId()
    reportSessionIdRef.current = sessionId

    const closestSegment = findClosestSegment(activeTrip.pathSegments ?? [], userLocation)
    if (!closestSegment) {
      setErrorPopup({
        visible: true,
        title: "Report Error",
        message: "Unable to determine the reported segment. Please try again.",
      })
      return
    }

    try {
      await createReportApi({
        segmentId: closestSegment.segmentId,
        sessionId,
        obstacleType: values.obstacle,
        condition: values.condition,
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
      })
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to submit the report. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Report Error",
        message,
      })
      return
    }

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

  function clearReportConfirmation() {
    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current)
      confirmationTimerRef.current = null
    }
    setReportConfirmation(null)
  }

  async function handleConfirmReport(decision: "CONFIRMED" | "REJECTED") {
    if (!reportConfirmation) return
    try {
      await confirmReportApi(reportConfirmation.reportId, {
        decision,
        sessionId: reportSessionIdRef.current ?? undefined,
      })
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to submit the confirmation.")
      setErrorPopup({
        visible: true,
        title: "Report Error",
        message,
      })
    } finally {
      clearReportConfirmation()
    }
  }

  async function loadReportsForPath(pathId: string) {
    try {
      const reports = await getReportsByPathApi(pathId)
      setReportsByPathId((current) => ({
        ...current,
        [pathId]: reports,
      }))
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to load reports for this path.")
      setErrorPopup({
        visible: true,
        title: "Reports Error",
        message,
      })
    }
  }

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current)
      }
    }
  }, [])


  React.useEffect(() => {
    if (!tripLaunchSelection) return
    setSelectedResult(tripLaunchSelection)
    setActiveTrip(tripLaunchSelection)
    setActiveTripStartedAt(new Date())
    void loadReportsForPath(tripLaunchSelection.id)
    resetOffRouteTracking()
    offRouteContinueUsedRef.current = false
    setOffRoutePopupVisible(false)
    setResultsVisible(false)
    setTripLaunchSelection(null)
  }, [tripLaunchSelection, setTripLaunchSelection])

  React.useEffect(() => {
    if (!hasActiveNavigation || !activeTrip || !userLocation || !activeTrip.route.length) {
      resetOffRouteTracking()
      setOffRoutePopupVisible(false)
      return
    }

    if (isOffRoutePopupVisible) return

    const distance = minDistanceToRouteMeters(activeTrip.route ?? [], userLocation)
    if (distance <= OFF_ROUTE_DISTANCE_METERS) {
      resetOffRouteTracking()
      return
    }

    offRouteCountRef.current += 1
    if (!offRouteStartedAtRef.current) {
      offRouteStartedAtRef.current = Date.now()
    }

    const elapsed = Date.now() - offRouteStartedAtRef.current
    if (offRouteCountRef.current >= OFF_ROUTE_MAX_CONSECUTIVE || elapsed >= OFF_ROUTE_MAX_MS) {
      setOffRoutePopupVisible(true)
    }
  }, [activeTrip, hasActiveNavigation, isOffRoutePopupVisible, userLocation])

  React.useEffect(() => {
    if (!activeTrip || !userLocation || !destinationPoint) {
      autoCompleteTriggeredRef.current = false
      return
    }
    if (autoCompleteTriggeredRef.current) return
    const distanceToDestination = haversineDistanceMetersLatLng(destinationPoint, userLocation)
    if (distanceToDestination > AUTO_COMPLETE_DISTANCE_METERS) return
    autoCompleteTriggeredRef.current = true
    void handleCompleteTrip()
  }, [activeTrip, destinationPoint, userLocation])

  React.useEffect(() => {
    if (!activeTrip || !userLocation || isGuest) return
    if (reportConfirmation) return
    const reports = reportsByPathId[activeTrip.id] ?? []
    if (!reports.length) return

    let closestReport: ReportSummary | null = null
    let closestDistance = Number.POSITIVE_INFINITY
    for (const report of reports) {
      if (report.status === "IGNORED") continue
      if (promptedReportIdsRef.current.has(report.reportId)) continue
      const distance = haversineDistanceMetersLatLng(
        { latitude: report.position.lat, longitude: report.position.lng },
        userLocation
      )
      if (distance < closestDistance) {
        closestDistance = distance
        closestReport = report
      }
    }

    if (!closestReport || closestDistance > REPORT_CONFIRM_DISTANCE_METERS) return

    promptedReportIdsRef.current.add(closestReport.reportId)
    setReportConfirmation(closestReport)
    confirmationTimerRef.current = setTimeout(() => {
      clearReportConfirmation()
    }, REPORT_CONFIRM_DISMISS_MS)
  }, [activeTrip, isGuest, reportConfirmation, reportsByPathId, userLocation])

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
            <Polyline coordinates={traversedRoute} strokeColor={palette.border.default} strokeWidth={10} />
          )}
          {upcomingRoute.length > 1 && (
            <Polyline coordinates={upcomingRoute} strokeColor={palette.brand.dark} strokeWidth={10} />
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
            <Marker coordinate={destinationPoint} title="Destination">
              <MapIconMarker
                color={palette.accent.green.base}
                borderColor={palette.text.onAccent}
                icon={<Bike size={iconSizes.md} color={palette.text.onAccent} strokeWidth={2.2} />}
              />
            </Marker>
          )}
          {(activeTrip?.id ?? selectedResult?.id) &&
            (reportsByPathId[activeTrip?.id ?? selectedResult?.id ?? ""] ?? []).map((report) => (
              <Marker
                key={`report-${report.reportId}`}
                coordinate={{ latitude: report.position.lat, longitude: report.position.lng }}
                title={getObstacleLabel(report.obstacleType)}
                description={getConditionLabel(report.pathStatus)}
              >
                <MapIconMarker
                  color={palette.status.danger}
                  borderColor={palette.text.onAccent}
                  icon={<AlertTriangle size={iconSizes.md} color={palette.text.onAccent} strokeWidth={2.2} />}
                />
              </Marker>
            ))}
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
              onClose={handleCloseResults}
              selectedResultId={selectedResult?.id ?? null}
              onSelectResult={handleSelectResult}
              actionLabel={canStartSelectedTrip ? "Start Trip" : undefined}
              onActionPress={canStartSelectedTrip ? handleStartTrip : undefined}
            />
          </>
        )}

        {hasActiveNavigation && (
          <>
            <Pressable
              style={[
                styles.closeTripButton,
                {
                  top: insets.top + verticalScale(12),
                  backgroundColor: palette.surface.card,
                  shadowColor: palette.border.muted,
                },
              ]}
              onPress={handleCancelTrip}
            >
              <X size={iconSizes.lg} color={palette.text.primary} strokeWidth={2.2} />
            </Pressable>
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
      />
      <AppPopup
        visible={Boolean(reportConfirmation)}
        title="Report check"
        message={`Is the ${getObstacleLabel(reportConfirmation?.obstacleType)} still present?`}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={clearReportConfirmation}
        primaryButton={{
          label: "Yes",
          variant: "primary",
          onPress: () => handleConfirmReport("CONFIRMED"),
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
        secondaryButton={{
          label: "No",
          variant: "outline",
          onPress: () => handleConfirmReport("REJECTED"),
          borderColor: palette.status.danger,
          textColor: palette.status.danger,
        }}
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
        visible={isCancelTripPopupVisible}
        title="End Trip?"
        message="Your progress will be discarded if you leave now."
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleCloseCancelTripPopup}
        primaryButton={{
          label: "Yes, Discard",
          variant: "destructive",
          onPress: handleConfirmCancelTrip,
        }}
        secondaryButton={{
          label: "No, Continue",
          variant: "secondary",
          onPress: handleCloseCancelTripPopup,
        }}
      />
      <AppPopup
        visible={isOffRoutePopupVisible}
        title="Off Route"
        message={offRouteMessage}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleContinueOffRoute}
        primaryButton={{
          label: "End Trip",
          variant: "destructive",
          onPress: handleEndOffRouteTrip,
        }}
        secondaryButton={
          canContinueOffRoute
            ? {
                label: "Continue",
                variant: "secondary",
                onPress: handleContinueOffRoute,
              }
            : undefined
        }
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

type LatLng = { latitude: number; longitude: number }

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function findClosestSegment(
  segments: Array<{ segmentId: string; polylineCoordinates: LatLng[] }>,
  position: LatLng
) {
  let bestSegment: { segmentId: string } | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const segment of segments) {
    if (!segment.polylineCoordinates.length && !bestSegment) {
      // Fallback when segment geometry is missing
      bestSegment = { segmentId: segment.segmentId }
    }
    for (const point of segment.polylineCoordinates) {
      const distance = Math.hypot(point.latitude - position.latitude, point.longitude - position.longitude)
      if (distance < bestDistance) {
        bestDistance = distance
        bestSegment = { segmentId: segment.segmentId }
      }
    }
  }

  return bestSegment
}

function buildTraversedTripSegments(
  segments: Array<{ segmentId: string; polylineCoordinates: LatLng[] }>,
  traversedPointCount: number
) {
  if (!segments.length) {
    return []
  }

  // If we haven't traversed at least 2 points, don't send any segments
  if (traversedPointCount < 2) {
    return []
  }

  const traversed: Array<{ segmentId: string; polylineCoordinates: Array<{ lat: number; lng: number }> }> = []
  let remainingUniquePoints = traversedPointCount
  let lastPoint: LatLng | null = null

  for (const segment of segments) {
    if (remainingUniquePoints <= 0) break
    if (!segment.polylineCoordinates.length) continue

    const slicedPoints: LatLng[] = []
    for (const point of segment.polylineCoordinates) {
      if (remainingUniquePoints <= 0) break
      const isUnique =
        !lastPoint || lastPoint.latitude !== point.latitude || lastPoint.longitude !== point.longitude
      if (isUnique) {
        remainingUniquePoints -= 1
      }
      slicedPoints.push(point)
      lastPoint = point
    }

    if (slicedPoints.length >= 2) {
      traversed.push({
        segmentId: segment.segmentId,
        polylineCoordinates: slicedPoints.map((point) => ({
          lat: point.latitude,
          lng: point.longitude,
        })),
      })
    }
  }

  return traversed
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
  closeTripButton: {
    position: "absolute",
    right: scale(20),
    width: scale(44),
    height: scale(44),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
})
