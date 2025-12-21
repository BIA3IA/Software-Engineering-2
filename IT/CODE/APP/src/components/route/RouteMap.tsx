import React, { useEffect, useMemo, useRef, useState } from "react"
import { View, Text, StyleSheet, Pressable, Modal, Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from "react-native-maps"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { textStyles, iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { Cloud } from "lucide-react-native"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"

type LatLng = { latitude: number; longitude: number }

export type WeatherDetails = {
  condition: string
  windSpeed: string
  humidity: string
  visibility: string
  pressure: string
}

type RouteMapProps = {
  route: LatLng[]
  temperatureLabel?: string
  weather?: WeatherDetails
  showWeatherBadge?: boolean
  title?: string
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
}: RouteMapProps) {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const badgeIconSize = iconSizes.sm
  const overlayIconSize = iconSizes.md

  const mapRef = useRef<MapView | null>(null)
  const badgeRef = useRef<View | null>(null)
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [overlayPosition, setOverlayPosition] = useState<{ top: number; right: number } | null>(null)
  const [badgeHeight, setBadgeHeight] = useState(0)

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
          >
            {route.length > 1 && (
              <Polyline
                coordinates={route}
                strokeWidth={4}
                strokeColor={palette.brand.dark}
              />
            )}

            {start && (
              <Circle
                center={start}
                radius={18}
                strokeColor={palette.brand.base}
                fillColor={`${palette.brand.base}33`}
              />
            )}

            {end && (
              <Marker
                coordinate={end}
                title="End"
                pinColor={palette.brand.base}
              />
            )}
          </MapView>
        </View>

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
                { backgroundColor: palette.overlay.scrim },
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
    marginBottom: verticalScale(14),
  },
  mapWrapper: {
    marginTop: verticalScale(10),
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
    top: verticalScale(10),
    right: scale(10),
    flexDirection: "row",
    alignItems: "center",
    columnGap: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: radius.full,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 6,
  },
  weatherText: {
    marginTop: verticalScale(1),
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
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 24,
    elevation: 10,
  },
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: verticalScale(8),
    borderTopWidth: 1,
  },
})
