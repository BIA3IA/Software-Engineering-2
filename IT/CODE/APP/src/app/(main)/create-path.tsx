import React from "react"
import { View, StyleSheet, Text } from "react-native"
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
import { CheckCircle } from "lucide-react-native"
import { lightMapStyle, darkMapStyle } from "@/theme/mapStyles"

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
  const visibilityLabel =
    PRIVACY_OPTIONS.find((option) => option.key === (searchParams.visibility as PrivacyPreference | undefined))
      ?.label ?? "Visibility"
  const { setHidden: setNavHidden } = useBottomNavVisibility()
  const mapRef = React.useRef<MapView | null>(null)
  const [drawnRoute, setDrawnRoute] = React.useState<LatLng[]>([])
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null)
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
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
    const { coordinate } = event.nativeEvent
    setDrawnRoute((prev) => [...prev, coordinate])
  }

  function handlePanDrag(event: any) {
    setDrawnRoute((prev) => {
      const { coordinate } = event.nativeEvent
      const last = prev[prev.length - 1]
      if (last && last.latitude === coordinate.latitude && last.longitude === coordinate.longitude) {
        return prev
      }
      return [...prev, coordinate]
    })
  }

  const canSave = drawnRoute.length > 1

  function handleSavePath() {
    if (!canSave) return
    console.log("Save new path", {
      name: searchParams.name,
      description: searchParams.description,
      visibility: searchParams.visibility,
      route: drawnRoute,
    })
    setSuccessPopupVisible(true)
  }

  function handleSuccessPrimaryPress() {
    setSuccessPopupVisible(false)
    router.replace("/paths")
  }

  function handleSuccessDismiss() {
    setSuccessPopupVisible(false)
    router.replace("/(main)/home")
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
      >
        {drawnRoute.length > 1 && (
          <Polyline coordinates={drawnRoute} strokeColor={palette.brand.base} strokeWidth={4} />
        )}
        {drawnRoute[0] && (
          <Circle
            center={drawnRoute[0]}
            radius={18}
            strokeColor={palette.brand.base}
            fillColor={`${palette.brand.base}33`}
          />
        )}
        {drawnRoute[drawnRoute.length - 1] && (
          <Marker
            coordinate={drawnRoute[drawnRoute.length - 1]}
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
        <Text style={[textStyles.caption, styles.infoBadge, { color: palette.text.primary }]}>
          {visibilityLabel}
        </Text>
      </View>

      <AppButton
        title="Save Path"
        onPress={handleSavePath}
        buttonColor={palette.brand.base}
        textColor={palette.text.inverse}
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
          label: "Go To My Paths",
          onPress: handleSuccessPrimaryPress,
          variant: "primary",
          buttonColor: palette.status.success,
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
})
