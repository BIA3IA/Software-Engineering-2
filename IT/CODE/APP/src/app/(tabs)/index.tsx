import MapView, { Polyline } from 'react-native-maps'
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import { YStack, Text, Button } from 'tamagui'

type Coord = { latitude: number; longitude: number }

export default function NavigationScreen() {
  const [coords, setCoords] = useState<Coord[]>([])
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const startTracking = async () => {
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 2, // meters
      },
      (location) => {
        const { latitude, longitude } = location.coords
        setCoords(prev => [...prev, { latitude, longitude }])
      }
    )
  }

  if (hasPermission === false) {
    return (
      <YStack flex={1}>
        <Text>Location permission denied</Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      <YStack p="$3">
        <Button onPress={startTracking}>Start Tracking</Button>
      </YStack>

      <MapView
        style={{ flex: 1 }}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: 45.4642,
          longitude: 9.1900,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {coords.length > 1 && (
          <Polyline
            coordinates={coords}
            strokeColor="#6d28d9"
            strokeWidth={4}
          />
        )}
      </MapView>
    </YStack>
  )
}
