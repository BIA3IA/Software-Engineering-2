import React, { useEffect, useMemo, useRef, useState } from "react"
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from "react-native-maps"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, spacing, verticalScale } from "@/theme/layout"
import { AlertTriangle, Bike, Cloud } from "lucide-react-native"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"
import { MapIconMarker } from "@/components/ui/MapIconMarker"
import { MapCallout } from "@/components/ui/MapCallout"
import { getConditionLabel, getObstacleLabel } from "@/utils/reportOptions"

type LatLng = { latitude: number; longitude: number }

export type WeatherDetails = {
  condition: string
  windSpeed: string
  humidity: string
  visibility: string
  pressure: string
  feelsLike?: string
  precipitation?: string
}

type RouteMapProps = {
  route: LatLng[]
  temperatureLabel?: string
  weather?: WeatherDetails
  showWeatherBadge?: boolean
  title?: string
  showUserLocation?: boolean
  reports?: { reportId: string; position: { lat: number; lng: number }; obstacleType?: string; pathStatus?: string }[]
}

export function RouteMap({
  route,
  temperatureLabel = "18°",
  weather = {
    condition: "Partly Cloudy",
    windSpeed: "12 km/h",
    humidity: "65%",
    visibility: "10 km",
    pressure: "1013 hPa",
  },
  showWeatherBadge = true,
  title = "Trip Map",
  showUserLocation = true,
  reports = [],
}: RouteMapProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const markerSize = scale(30)
  const insets = useSafeAreaInsets()
  const badgeIconSize = iconSizes.sm
  const overlayIconSize = iconSizes.md

  const mapRef = useRef<MapView | null>(null)
  const badgeRef = useRef<View | null>(null)
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; right: number } | null>(null)
  const [badgeHeight, setBadgeHeight] = useState(0)
  const [calloutState, setCalloutState] = useState<{
    x: number
    y: number
    coord: { latitude: number; longitude: number }
    items: Parameters<typeof MapCallout>[0]["items"]
    variant: "purple" | "green" | "orange" | "red" | "blue"
    visible: boolean
  } | null>(null)
  const [calloutSize, setCalloutSize] = useState({ width: 0, height: 0 })
  const [mapLayout, setMapLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const start = route[0]
  const end = route[route.length - 1]

  const initialRegion = useMemo(() => regionFromRoute(route), [route])

  useEffect(() => {
    if (!mapRef.current) return
    if (!route?.length) return

    // Fit map to route coordinates with padding
    requestAnimationFrame(() => {
      mapRef.current?.fitToCoordinates(route, {
        edgePadding: {
          top: 40,
          right: 40,
          bottom: 40,
          left: 40,
        },
        animated: true,
      })
    })
  }, [route])

  function toggleWeather() {
    if (weatherOpen) {
      setWeatherOpen(false)
      return
    }

    if (badgeRef.current) {
      badgeRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get("window").width
        setOverlayPosition({
          top: y + height + verticalScale(6),
          right: Math.max(scale(12), screenWidth - (x + width)),
        })
        setBadgeHeight(height)
        setWeatherOpen(true)
      })
    } else {
      setOverlayPosition(null)
      setWeatherOpen(true)
    }
  }

  async function openMapCallout(
    coordinate: { latitude: number; longitude: number },
    items: Parameters<typeof MapCallout>[0]["items"],
    variant: "purple" | "green" | "orange" | "red" | "blue"
  ) {
    try {
      const point = await mapRef.current?.pointForCoordinate(coordinate)
      if (!point) {
        setCalloutState({
          x: mapLayout.width / 2,
          y: mapLayout.height / 2,
          coord: coordinate,
          items,
          variant,
          visible: true,
        })
        return
      }
      setCalloutState({ x: point.x, y: point.y, coord: coordinate, items, variant, visible: true })
    } catch {
      setCalloutState({
        x: mapLayout.width / 2,
        y: mapLayout.height / 2,
        coord: coordinate,
        items,
        variant,
        visible: true,
      })
    }
  }

  async function refreshCalloutPosition() {
    if (!calloutState) return
    try {
      const point = await mapRef.current?.pointForCoordinate(calloutState.coord)
      if (!point) return
      setCalloutState((prev) => {
        if (!prev) return prev
        if (!prev.visible) return prev
        const edgeMargin = scale(80)
        const isInside =
          point.x >= edgeMargin &&
          point.y >= edgeMargin &&
          point.x <= mapLayout.width - edgeMargin &&
          point.y <= mapLayout.height - edgeMargin
        return {
          ...prev,
          x: point.x,
          y: point.y,
          visible: isInside ? true : false,
        }
      })
    } catch {
      // no-op
    }
  }

  return (
    <View style={styles.section}>
      <Text style={[textStyles.cardTitle, { color: palette.text.link }]}>
        {title}
      </Text>

      <View style={styles.mapWrapper}>
        <View style={styles.mapContainer}>
          <MapView
            ref={(r) => {
              mapRef.current = r
            }}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={initialRegion}
            pitchEnabled={false}
            rotateEnabled={false}
            toolbarEnabled={false}
            customMapStyle={scheme === "dark" ? darkMapStyle : lightMapStyle}
            showsCompass={false}
            showsUserLocation={showUserLocation}
            showsMyLocationButton={false}
            onPress={() => setCalloutState(null)}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout
              setMapLayout({ x, y, width, height })
            }}
            onRegionChangeComplete={() => {
              void refreshCalloutPosition()
            }}
          >
            {route.length > 1 && (
              <Polyline
                coordinates={route}
                strokeWidth={10}
                strokeColor={palette.brand.dark}
              />
            )}

            {start && (
              <Circle
                center={start}
                radius={2}
                strokeColor={palette.brand.base}
                fillColor={`${palette.brand.base}22`}
              />
            )}

            {end && (
              <Marker
                coordinate={end}
                onPress={() =>
                  openMapCallout(end, [
                    {
                      value: "Destination",
                      tone: "green",
                    },
                  ], "green")
                }
              >
                <MapIconMarker
                  color={palette.accent.green.base}
                  borderColor={palette.text.onAccent}
                  icon={<Bike size={iconSizes.md} color={palette.text.onAccent} strokeWidth={2.2} />}
                />
              </Marker>
            )}
            {reports.map((report) => (
              <Marker
                key={`report-${report.reportId}`}
                coordinate={{ latitude: report.position.lat, longitude: report.position.lng }}
                onPress={() =>
                  openMapCallout(
                    { latitude: report.position.lat, longitude: report.position.lng },
                    (() => {
                      const toneKey = getConditionToneKey(report.pathStatus)
                      return [
                        {
                          value: getObstacleLabel(report.obstacleType),
                          tone: "orange",
                        },
                        {
                          value: getConditionLabel(report.pathStatus),
                          tone: toneKey,
                        },
                      ]
                    })(),
                    "red"
                  )
                }
              >
                <MapIconMarker
                  color={palette.status.danger}
                  borderColor={palette.text.onAccent}
                  icon={<AlertTriangle size={iconSizes.md} color={palette.text.onAccent} strokeWidth={2.2} />}
                />
              </Marker>
            ))}
          </MapView>
        </View>

        {calloutState?.visible ? (
          <View pointerEvents="box-none" style={styles.calloutOverlay}>
            <View
              onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout
                if (width && height && (width !== calloutSize.width || height !== calloutSize.height)) {
                  setCalloutSize({ width, height })
                }
              }}
              style={[
                styles.calloutAnchor,
                {
                  left: clamp(
                    mapLayout.x + calloutState.x - calloutSize.width / 2 - scale(11),
                    mapLayout.x + scale(8),
                    mapLayout.x + mapLayout.width - calloutSize.width - scale(8)
                  ),
                  top: clamp(
                    mapLayout.y + calloutState.y - calloutSize.height - verticalScale(26) - markerSize / 2,
                    mapLayout.y + verticalScale(8),
                    mapLayout.y + mapLayout.height - calloutSize.height - verticalScale(8)
                  ),
                },
              ]}
            >
              <MapCallout items={calloutState.items} variant={calloutState.variant} />
            </View>
          </View>
        ) : null}

        {showWeatherBadge && (
          <Pressable
            ref={badgeRef}
            onLayout={(event) => {
              setBadgeHeight(event.nativeEvent.layout.height)
            }}
            onPress={toggleWeather}
            style={({ pressed }) => [
              styles.weatherBadge,
              { backgroundColor: palette.surface.card, shadowColor: palette.border.muted },
              pressed && { opacity: 0.85 },
            ]}
            testID="route-map-weather"
          >
            <Cloud size={badgeIconSize} color={palette.brand.dark} />
            <Text style={[textStyles.bodySmall, styles.weatherText, { color: palette.text.link }]}>
              {temperatureLabel}
            </Text>
          </Pressable>
        )}
      </View>

      {showWeatherBadge && (
        <Modal
          visible={weatherOpen}
          animationType="fade"
          transparent
          statusBarTranslucent
          onRequestClose={() => setWeatherOpen(false)}
        >
          <View style={styles.overlayWrapper}>
            <Pressable
              style={[
                styles.overlayScrim,
                { backgroundColor: palette.overlay.scrim, opacity: 0.35 },
              ]}
              onPress={() => setWeatherOpen(false)}
            />

            <View
              style={[
                styles.overlayCard,
                {
                  backgroundColor: palette.surface.card,
                  shadowColor: palette.border.muted,
                  top:
                    (overlayPosition?.top ??
                      (badgeHeight
                        ? badgeHeight + verticalScale(24)
                        : verticalScale(60))) +
                    insets.top,
                  right: overlayPosition?.right ?? scale(16),
                },
              ]}
            >
              <View style={styles.weatherHeaderRow}>
                <Text style={[textStyles.cardTitle, { color: palette.text.link }]}>
                  Weather Details
                </Text>
                <Cloud size={overlayIconSize} color={palette.brand.dark} />
              </View>

              <WeatherRow label="Condition" value={weather.condition} />
              <WeatherRow label="Wind Speed" value={weather.windSpeed} />
              <WeatherRow label="Humidity" value={weather.humidity} />
              <WeatherRow label="Feels Like" value={weather.feelsLike ?? "N/A"} />
              <WeatherRow label="Precipitation" value={weather.precipitation ?? "N/A"} />
              <WeatherRow label="Visibility" value={weather.visibility} />
              <WeatherRow label="Pressure" value={weather.pressure} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

function WeatherRow({ label, value }: { label: string; value: string }) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  return (
    <View style={[styles.row, { borderColor: palette.border.muted }]}>
      <Text style={[textStyles.bodySmall, { color: palette.text.secondary }]}>
        {label}
      </Text>
      <Text style={[textStyles.bodySmall, { color: palette.text.link }]}>
        {value}
      </Text>
    </View>
  )
}

type ToneKey = "purple" | "green" | "orange" | "red" | "blue"

function getConditionToneKey(condition?: string): ToneKey {
  switch (condition) {
    case "SUFFICIENT":
      return "green"
    case "MEDIUM":
      return "blue"
    case "REQUIRES_MAINTENANCE":
      return "orange"
    case "CLOSED":
      return "red"
    default:
      return "purple"
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function regionFromRoute(route: LatLng[]) {

  const fallback = {
    latitude: 45.4642,
    longitude: 9.19,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }

  if (!route?.length) return fallback

  let minLat = route[0].latitude
  let maxLat = route[0].latitude
  let minLng = route[0].longitude
  let maxLng = route[0].longitude

  for (const p of route) {
    minLat = Math.min(minLat, p.latitude)
    maxLat = Math.max(maxLat, p.latitude)
    minLng = Math.min(minLng, p.longitude)
    maxLng = Math.max(maxLng, p.longitude)
  }

  const latitude = (minLat + maxLat) / 2
  const longitude = (minLng + maxLng) / 2

  const latDelta = Math.max(0.01, (maxLat - minLat) * 1.8)
  const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.8)

  return {
    latitude,
    longitude,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  }
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    marginTop: 10,
    position: "relative",
  },
  mapContainer: {
    height: verticalScale(190),
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  weatherBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  weatherText: {
    marginTop: 1,
  },
  overlayWrapper: {
    flex: 1,
  },
  overlayScrim: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  overlayCard: {
    position: "absolute",
    width: scale(230),
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 10,
  },
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
  },
  calloutOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  calloutAnchor: {
    position: "absolute",
  },
})
