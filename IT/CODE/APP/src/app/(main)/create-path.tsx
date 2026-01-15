import React from "react"
import { View, StyleSheet, Text, Pressable } from "react-native"
import MapView, { Marker, Polyline, Circle } from "react-native-maps"
import * as Location from "expo-location"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams } from "expo-router"

import { useBottomNavVisibility } from "@/hooks/useBottomNavVisibility"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { radius, scale, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { PRIVACY_OPTIONS, type PrivacyPreference } from "@/constants/Privacy"
import { AppPopup } from "@/components/ui/AppPopup"
import { AppButton } from "@/components/ui/AppButton"
import { AlertTriangle, CheckCircle, Pencil, Undo2 } from "lucide-react-native"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"
import { createPathApi, snapPathApi, type PathPoint, type PathSegment } from "@/api/paths"
import { getApiErrorMessage } from "@/utils/apiError"

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
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSnapping, setIsSnapping] = React.useState(false)
  const [isDrawMode, setIsDrawMode] = React.useState(true)
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
  const mapKey = userLocation
    ? `user-${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}`
    : "default"

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
    if (!mapRef.current || !userLocation) return
    mapRef.current.animateToRegion(regionAroundPoint(userLocation, 0.008), 400)
  }, [userLocation])

  function handleMapPress(event: any) {
    if (!isDrawMode) return
    const coordinate = event?.nativeEvent?.coordinate
    if (!coordinate) return
    setDrawnRoute((prev) => {
      const next = [...prev, coordinate]
      drawnRouteRef.current = next
      return next
    })
  }

  function handlePanDrag(event: any) {
    if (!isDrawMode) return
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

  const activeRoute = snappedSegments.length ? flattenSnappedSegments(snappedSegments) : drawnRoute
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
        creationMode: "manual", // only manual for now
        title,
        description,
        pathSegments,
      })
      console.log("Path saved successfully")
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

  function beginStroke() {
    if (!isDrawMode) return
    if (strokeStartRef.current === null) {
      strokeStartRef.current = drawnRouteRef.current.length
    }
  }

  function endStroke() {
    if (!isDrawMode) return
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
        initialRegion={userLocation ? regionAroundPoint(userLocation, 0.008) : DEFAULT_REGION}
        customMapStyle={scheme === "dark" ? darkMapStyle : lightMapStyle}
        key={mapKey}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onPanDrag={handlePanDrag}
        onTouchStart={beginStroke}
        onTouchEnd={endStroke}
        onTouchCancel={endStroke}
        scrollEnabled={!isDrawMode}
        zoomEnabled={!isDrawMode}
        rotateEnabled={!isDrawMode}
        pitchEnabled={!isDrawMode}
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
          <Marker
            coordinate={activeRoute[activeRoute.length - 1]}
            title="Current"
            pinColor={palette.brand.dark}
          />
        )}
      </MapView>

      <View
        style={[
          styles.infoBar,
          {
            backgroundColor: palette.surface.elevated,
            top: insets.top + verticalScale(16),
            shadowColor: palette.border.muted,
          },
        ]}
      >
        <Text style={[textStyles.cardTitle, styles.infoTitle, { color: palette.text.primary }]}>
          {searchParams.name ?? "New Path"}
        </Text>
        {searchParams.description ? (
          <Text style={[textStyles.caption, styles.infoSubtitle, { color: palette.text.secondary }]} numberOfLines={2}>
            {searchParams.description}
          </Text>
        ) : null}
      </View>

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
      >
        <Undo2
          size={iconSizes.lg}
          color={drawnRoute.length > 0 ? palette.text.primary : palette.text.muted}
        />
      </Pressable>

      <AppButton
        title={isSaving ? "Saving Path..." : isSnapping ? "Snapping..." : "Save Path"}
        onPress={handleSavePath}
        buttonColor={palette.brand.base}
        textColor={palette.text.onAccent}
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
  infoBar: {
    position: "absolute",
    left: scale(16),
    right: scale(16),
    padding: scale(14),
    borderRadius: radius.xl,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: radius.lg,
    elevation: 10,
    gap: verticalScale(4),
    zIndex: 10,
  },
  infoTitle: {
    fontSize: 18,
  },
  infoSubtitle: {
    marginTop: verticalScale(2),
  },
  infoBadge: {
    marginTop: verticalScale(4),
    alignSelf: "flex-start",
  },
  saveButton: {
    position: "absolute",
    alignSelf: "center",
    width: "80%",
    paddingVertical: verticalScale(14),
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
    opacity: 0.9,
  },
  undoFab: {
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
    opacity: 0.9,
  },
})
