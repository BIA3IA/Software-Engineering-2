import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Button } from 'react-native-paper'

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
        distanceInterval: 2,
      },
      (location) => {
        const { latitude, longitude } = location.coords
        setCoords(prev => [...prev, { latitude, longitude }])
      }
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>Location permission denied</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Button mode="contained" onPress={startTracking}>
          Start Tracking
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tracked points: {coords.length}</Text>
        {coords.at(-1) ? (
          <Text>
            Last position: {coords.at(-1)?.latitude.toFixed(5)}, {coords.at(-1)?.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text>No points yet. Tap “Start Tracking”.</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  label: {
    fontWeight: "700",
  },
})
