import React from "react"
import { View, StyleSheet, Pressable } from "react-native"
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams } from "expo-router"

import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { controlSizes, floatingMetrics, radius, scale, shadowStyles, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import { PRIVACY_OPTIONS, type PrivacyPreference } from "@/constants/Privacy"
import { FOLLOW_ZOOM } from "@/constants/appConfig"
import { AppPopup } from "@/components/ui/AppPopup"
import { AppButton } from "@/components/ui/AppButton"
import { AlertTriangle, Bike, CheckCircle, Pencil, Undo2, X } from "lucide-react-native"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"
import { createPathApi, snapPathApi, type PathPoint, type PathSegment } from "@/api/paths"
import { getApiErrorMessage } from "@/utils/apiError"
import { MapIconMarker } from "@/components/ui/MapIconMarker"
import { haversineDistanceMetersLatLng } from "@/utils/geo"
import { useFollowUserLocation } from "@/hooks/useFollowUserLocation"

type LatLng = {
  latitude: number
  longitude: number
}

const DEFAULT_REGION = {
  latitude: 45.478,
  longitude: 9.227,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
}

const AUTO_MIN_DISTANCE_METERS = 4

export default function CreatePathScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const searchParams = useLocalSearchParams()
  const visibilityPreference =
    (searchParams.visibility as PrivacyPreference | undefined) ?? PRIVACY_OPTIONS[0]?.key ?? "public"
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const mapRef = React.useRef<MapView | null>(null)
  const [drawnRoute, setDrawnRoute] = React.useState<LatLng[]>([])
  const drawnRouteRef = React.useRef<LatLng[]>([])
  const [snappedSegments, setSnappedSegments] = React.useState<LatLng[][]>([])
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null)
  const [isMapReady, setMapReady] = React.useState(false)
  const creationModeParam = typeof searchParams.creationMode === "string" ? searchParams.creationMode : undefined
  const initialCreationMode = creationModeParam === "automatic" ? "automatic" : "manual"
  const [creationMode, setCreationMode] = React.useState<"manual" | "automatic">(initialCreationMode)
  const creationModeRef = React.useRef<"manual" | "automatic">(initialCreationMode)
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSnapping, setIsSnapping] = React.useState(false)
  const [isDrawMode, setIsDrawMode] = React.useState(initialCreationMode === "manual")
  const [isCancelPopupVisible, setCancelPopupVisible] = React.useState(false)
  const [errorPopup, setErrorPopup] = React.useState({
    visible: false,
    title: "",
    message: "",
  })
  const snapInFlightRef = React.useRef(false)
  const pendingSnapRef = React.useRef<[LatLng, LatLng] | null>(null)
  const lastSnapAtRef = React.useRef(0)
  const lastSnappedIndexRef = React.useRef(0)
  const snapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapVersionRef = React.useRef(0)
  const strokeStartRef = React.useRef<number | null>(null)
  const strokeBreaksRef = React.useRef<number[]>([])
  const lastAutoPointRef = React.useRef<LatLng | null>(null)
  const lastAutoAtRef = React.useRef(0)
  const hasCenteredRef = React.useRef(false)
  const lastLocationRef = React.useRef<LatLng | null>(null)
  const lastLocationAtRef = React.useRef(0)

  const { followsUserLocation, gesturesDisabled } = useFollowUserLocation({
    enabled: creationMode === "automatic",
    mapRef,
    target: userLocation,
    ready: isMapReady,
    zoom: FOLLOW_ZOOM,
    minDistanceMeters: 6,
    minIntervalMs: 300,
    durationMs: 220,
    disableGestures: true,
  })

  React.useEffect(() => {
    setNavHidden(true)
    return () => {
      setNavHidden(false)
    }
  }, [setNavHidden])

  React.useEffect(() => {
    drawnRouteRef.current = drawnRoute
  }, [drawnRoute])

  React.useEffect(() => {
    creationModeRef.current = creationMode
  }, [creationMode])

  React.useEffect(() => {
    const nextMode = creationModeParam === "automatic" ? "automatic" : "manual"
    setCreationMode(nextMode)
    setIsDrawMode(nextMode === "manual")
    resetRouteState()
  }, [creationModeParam])

  function resetRouteState() {
    snapVersionRef.current += 1
    pendingSnapRef.current = null
    lastSnappedIndexRef.current = 0
    strokeStartRef.current = null
    strokeBreaksRef.current = []
    lastAutoPointRef.current = null
    lastAutoAtRef.current = 0
    setDrawnRoute([])
    setSnappedSegments([])
    setIsSnapping(false)
  }

  React.useEffect(() => {
    let cancelled = false
    let watcher: Location.LocationSubscription | null = null

    async function initLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          return
        }
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        })
        if (cancelled) return
        const coords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        }
        setUserLocation(coords)
        lastLocationRef.current = coords
        lastLocationAtRef.current = Date.now()

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.LocationAccuracy.Balanced,
            distanceInterval: 5,
          },
          (location) => {
            if (cancelled) return
            const next = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }
            const now = Date.now()
            const lastLocation = lastLocationRef.current
            const locationDistance =
              lastLocation ? haversineDistanceMetersLatLng(lastLocation, next) : Number.POSITIVE_INFINITY
            if (!lastLocation || locationDistance > 3 || now - lastLocationAtRef.current > 1000) {
              setUserLocation(next)
              lastLocationRef.current = next
              lastLocationAtRef.current = now
            }

            if (creationModeRef.current !== "automatic") return
            const lastPoint = lastAutoPointRef.current
            if (!lastPoint) {
              lastAutoPointRef.current = next
              lastAutoAtRef.current = now
              setDrawnRoute([next])
              return
            }
            const autoDistance = haversineDistanceMetersLatLng(lastPoint, next)
            if (autoDistance < AUTO_MIN_DISTANCE_METERS) return
            lastAutoPointRef.current = next
            lastAutoAtRef.current = now
            setDrawnRoute((prev) => [...prev, next])
          }
        )
      } catch (error) {
        console.warn("Failed to fetch location", error)
      }
    }

    initLocation()

    return () => {
      cancelled = true
      if (watcher) {
        watcher.remove()
      }
    }
  }, [])

  React.useEffect(() => {
    if (!mapRef.current || !userLocation || hasCenteredRef.current) return
    hasCenteredRef.current = true
    mapRef.current.animateToRegion(regionAroundPoint(userLocation, 0.008), 400)
  }, [userLocation])

  function handleMapPress(event: any) {
    if (!isDrawMode || creationModeRef.current !== "manual") return
    const coordinate = event?.nativeEvent?.coordinate
    if (!coordinate) return
    setDrawnRoute((prev) => {
      const next = [...prev, coordinate]
      drawnRouteRef.current = next
      return next
    })
  }

  function handlePanDrag(event: any) {
    if (!isDrawMode || creationModeRef.current !== "manual") return
    const coordinate = event?.nativeEvent?.coordinate
    if (!coordinate) return
    setDrawnRoute((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.latitude === coordinate.latitude && last.longitude === coordinate.longitude) {
        return prev
      }
      const next = [...prev, coordinate]
      drawnRouteRef.current = next
      return next
    })
  }

  const activeRoute =
    creationMode === "manual"
      ? snappedSegments.length
        ? flattenSnappedSegments(snappedSegments)
        : drawnRoute
      : drawnRoute
  const canSave = activeRoute.length > 1

  async function handleSavePath() {
    if (!canSave || isSaving || isSnapping) return
    const title = typeof searchParams.name === "string" ? searchParams.name : "New Path"
    const description = typeof searchParams.description === "string" ? searchParams.description : undefined
    const pathSegments = buildPathSegments(activeRoute)
    if (!pathSegments.length) return

    setIsSaving(true)
    try {
      await createPathApi({
        visibility: visibilityPreference === "public",
        creationMode,
        title,
        description,
        pathSegments,
      })
      setSuccessPopupVisible(true)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to save the path. Please try again.")
      setErrorPopup({
        visible: true,
        title: "Save failed",
        message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handleSuccessPrimaryPress() {
    setSuccessPopupVisible(false)
    router.replace("/paths")
  }

  function handleSuccessDismiss() {
    setSuccessPopupVisible(false)
    router.replace("/(main)/home")
  }

  function handleCancelCreate() {
    setCancelPopupVisible(true)
  }

  function handleConfirmCancel() {
    setCancelPopupVisible(false)
    router.replace("/(main)/home")
  }

  function handleCloseCancelPopup() {
    setCancelPopupVisible(false)
  }

  function beginStroke() {
    if (!isDrawMode || creationModeRef.current !== "manual") return
    if (strokeStartRef.current === null) {
      strokeStartRef.current = drawnRouteRef.current.length
    }
  }

  function endStroke() {
    if (!isDrawMode || creationModeRef.current !== "manual") return
    if (strokeStartRef.current === null) return
    const startIndex = strokeStartRef.current
    strokeStartRef.current = null
    if (drawnRouteRef.current.length > startIndex) {
      strokeBreaksRef.current.push(startIndex)
    }
  }

  function handleUndo() {
    snapVersionRef.current += 1
    pendingSnapRef.current = null
    const breaks = strokeBreaksRef.current
    const targetLength = breaks.length ? (breaks.pop() as number) : Math.max(0, drawnRouteRef.current.length - 1)
    setDrawnRoute((prev) => {
      if (!prev.length) return prev
      const next = prev.slice(0, targetLength)
      drawnRouteRef.current = next
      lastSnappedIndexRef.current = next.length
      return next
    })
    setSnappedSegments((prev) => {
      const keepCount = Math.max(0, Math.min(prev.length, targetLength - 1))
      return prev.slice(0, keepCount)
    })
  }

  function queueSnapSegment(start: LatLng, end: LatLng) {
    const now = Date.now()
    const delay = Math.max(0, 350 - (now - lastSnapAtRef.current))

    if (snapInFlightRef.current || delay > 0) {
      pendingSnapRef.current = [start, end]
      setIsSnapping(true)
      if (delay > 0 && !snapTimerRef.current) {
        snapTimerRef.current = setTimeout(() => {
          snapTimerRef.current = null
          const pending = pendingSnapRef.current
          if (pending) {
            pendingSnapRef.current = null
            queueSnapSegment(pending[0], pending[1])
          }
        }, delay)
      }
      return
    }
    void snapSegment(start, end)
  }

  async function snapSegment(start: LatLng, end: LatLng) {
    snapInFlightRef.current = true
    const version = snapVersionRef.current
    lastSnapAtRef.current = Date.now()
    setIsSnapping(true)

    try {
      const snapped = await snapPathApi({
        coordinates: [toPathPoint(start), toPathPoint(end)],
      })
      if (version !== snapVersionRef.current) return
      const snappedLatLng = snapped.map(toLatLng)
      if (!snappedLatLng.length) return

      setSnappedSegments((prev) => [...prev, snappedLatLng])
    } catch (error) {
      console.warn("Failed to snap segment", error)
      setSnappedSegments((prev) => prev)
    } finally {
      snapInFlightRef.current = false
      const pending = pendingSnapRef.current
      pendingSnapRef.current = null
      if (pending) {
        queueSnapSegment(pending[0], pending[1])
      } else {
        setIsSnapping(false)
      }
    }
  }

  React.useEffect(() => {
    if (creationMode !== "manual") return
    if (drawnRoute.length <= 1) {
      setSnappedSegments([])
      lastSnappedIndexRef.current = drawnRoute.length
      return
    }

    if (drawnRoute.length <= lastSnappedIndexRef.current) return

    const start = drawnRoute[drawnRoute.length - 2]
    const end = drawnRoute[drawnRoute.length - 1]
    lastSnappedIndexRef.current = drawnRoute.length

    queueSnapSegment(start, end)
  }, [drawnRoute])

  React.useEffect(() => {
    return () => {
      if (snapTimerRef.current) {
        clearTimeout(snapTimerRef.current)
      }
    }
  }, [])

  function handleErrorClose() {
    setErrorPopup((prev) => ({
      ...prev,
      visible: false,
    }))
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={(ref) => {
          mapRef.current = ref
        }}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={userLocation ? regionAroundPoint(userLocation, 0.008) : DEFAULT_REGION}
        customMapStyle={scheme === "dark" ? darkMapStyle : lightMapStyle}
        showsUserLocation
        followsUserLocation={followsUserLocation}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
        onPress={handleMapPress}
        onPanDrag={handlePanDrag}
        onTouchStart={beginStroke}
        onTouchEnd={endStroke}
        onTouchCancel={endStroke}
        scrollEnabled={gesturesDisabled ? false : !isDrawMode}
        zoomEnabled={gesturesDisabled ? false : !isDrawMode}
        rotateEnabled={gesturesDisabled ? false : !isDrawMode}
        pitchEnabled={gesturesDisabled ? false : !isDrawMode}
      >
        {activeRoute.length > 1 && (
          <Polyline coordinates={activeRoute} strokeColor={palette.brand.base} strokeWidth={10} />
        )}
        {activeRoute[0] && (
          <Circle
            center={activeRoute[0]}
            radius={18}
            strokeColor={palette.brand.base}
            fillColor={`${palette.brand.base}33`}
          />
        )}
        {activeRoute[activeRoute.length - 1] && (
          <Marker coordinate={activeRoute[activeRoute.length - 1]} title="Current">
            <MapIconMarker
              color={palette.accent.green.base}
              borderColor={palette.text.onAccent}
              icon={<Bike size={iconSizes.md} color={palette.text.onAccent} strokeWidth={2.2} />}
            />
          </Marker>
        )}
      </MapView>

      <Pressable
        style={[
          styles.closeButton,
          {
            top: insets.top + verticalScale(12),
            backgroundColor: palette.surface.card,
            shadowColor: palette.border.muted,
          },
        ]}
        onPress={handleCancelCreate}
        testID="create-path-cancel"
      >
        <X size={iconSizes.lg} color={palette.text.primary} strokeWidth={2.2} />
      </Pressable>

      {creationMode === "manual" && (
        <>
          <Pressable
            style={[
              styles.drawFab,
              {
                backgroundColor: isDrawMode ? palette.brand.base : palette.surface.muted,
                shadowColor: palette.border.muted,
                bottom: verticalScale(90) + insets.bottom,
              },
            ]}
            onPress={() => setIsDrawMode((current) => !current)}
            testID="create-path-draw-toggle"
          >
            <Pencil size={iconSizes.lg} color={isDrawMode ? palette.text.onAccent : palette.text.primary} />
          </Pressable>

          <Pressable
            style={[
              styles.undoFab,
              {
                backgroundColor: drawnRoute.length > 0 ? palette.surface.card : palette.surface.muted,
                shadowColor: palette.border.muted,
                bottom: verticalScale(90) + insets.bottom + scale(64),
              },
            ]}
            onPress={handleUndo}
            disabled={drawnRoute.length === 0}
            testID="create-path-undo"
          >
            <Undo2
              size={iconSizes.lg}
              color={drawnRoute.length > 0 ? palette.text.primary : palette.text.muted}
            />
          </Pressable>
        </>
      )}

      <AppButton
        title={isSaving ? "Saving Path..." : isSnapping ? "Snapping..." : "Save Path"}
        onPress={handleSavePath}
        buttonColor={palette.brand.base}
        textColor={palette.text.onAccent}
        testID="create-path-save"
        style={[
          styles.saveButton,
          {
            shadowColor: palette.border.muted,
            bottom: insets.bottom + verticalScale(24),
          },
        ]}
      />
      <AppPopup
        visible={isSuccessPopupVisible}
        title="Path Creates!"
        message="Your new path has been saved and is ready to be used!"
        icon={<CheckCircle size={iconSizes.xl} color={palette.status.success} />}
        iconBackgroundColor={`${palette.accent.green.surface}`}
        onClose={handleSuccessDismiss}
        primaryButton={{
          label: "Go To Path Library",
          onPress: handleSuccessPrimaryPress,
          variant: "primary",
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
        onClose={handleErrorClose}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: handleErrorClose,
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
      />
      <AppPopup
        visible={isCancelPopupVisible}
        title="Discard Path?"
        message="Your draft will be lost if you leave now."
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleCloseCancelPopup}
        primaryButton={{
          label: "Yes, Discard",
          variant: "destructive",
          onPress: handleConfirmCancel,
        }}
        secondaryButton={{
          label: "No, Continue",
          variant: "secondary",
          onPress: handleCloseCancelPopup,
        }}
      />
    </View>
  )
}

function regionAroundPoint(point: LatLng, delta = 0.01) {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  }
}

function buildPathSegments(points: LatLng[]): PathSegment[] {
  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    return {
      start: { lat: point.latitude, lng: point.longitude },
      end: { lat: next.latitude, lng: next.longitude },
    }
  })
}

function toPathPoint(point: LatLng): PathPoint {
  return { lat: point.latitude, lng: point.longitude }
}

function toLatLng(point: PathPoint): LatLng {
  return { latitude: point.lat, longitude: point.lng }
}

function flattenSnappedSegments(segments: LatLng[][]): LatLng[] {
  const result: LatLng[] = []
  for (const segment of segments) {
    if (!segment.length) continue
    if (!result.length) {
      result.push(...segment)
      continue
    }
    const last = result[result.length - 1]
    const first = segment[0]
    if (isSamePoint(last, first)) {
      result.push(...segment.slice(1))
    } else {
      result.push(...segment)
    }
  }
  return result
}

function isSamePoint(a: LatLng, b: LatLng) {
  return Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: floatingMetrics.compactControlRight,
    width: scale(controlSizes.compactFab),
    height: scale(controlSizes.compactFab),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyles.iconButton,
    zIndex: 12,
  },
  saveButton: {
    position: "absolute",
    alignSelf: "center",
    width: "80%",
    paddingVertical: floatingMetrics.actionButtonInsetY,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 14,
    elevation: 10,
  },
  saveButtonText: {
    fontSize: 16,
  },
  drawFab: {
    position: "absolute",
    right: floatingMetrics.fabRight,
    width: scale(controlSizes.fab),
    height: scale(controlSizes.fab),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyles.fab,
    opacity: 0.9,
  },
  undoFab: {
    position: "absolute",
    right: floatingMetrics.fabRight,
    width: scale(controlSizes.fab),
    height: scale(controlSizes.fab),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadowStyles.fab,
    opacity: 0.9,
  },
})
