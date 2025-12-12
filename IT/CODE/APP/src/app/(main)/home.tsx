import React from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import MapView from "react-native-maps"
import { Plus, Navigation, MapPin } from "lucide-react-native"

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

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"
  const requireLogin = useLoginPrompt()
  const insets = useSafeAreaInsets()
  const [startPoint, setStartPoint] = React.useState("")
  const [destination, setDestination] = React.useState("")
  const [resultsVisible, setResultsVisible] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])

  const fabBg = isGuest ? palette.mutedBg : palette.primary
  const iconColor = isGuest ? palette.muted : palette.textInverse

  function handleFabPress() {
    if (isGuest) {
      requireLogin()
      return
    }
    // TODO trigger creation
    console.log("Create new path tapped")
  }

  function handleFindPaths() {
    if (!startPoint.trim() || !destination.trim()) {
      return
    }
    setResultsVisible(true)
    setResults([
      {
        id: "central-loop",
        title: "Central Park Loop",
        description: "Scenic path through the park",
        tags: [
          { label: "5.2 km", color: palette.primarySoft, textColor: palette.primary },
          { label: "Optimal", color: palette.greenSoft, textColor: palette.green },
        ],
      },
      {
        id: "river-trail",
        title: "River Trail",
        description: "Riverside bike path with great views",
        tags: [
          { label: "8.4 km", color: palette.primarySoft, textColor: palette.primary },
          { label: "Maintenance", color: palette.orangeSoft, textColor: palette.orange },
          { label: "3 reports", color: palette.redSoft, textColor: palette.red },
        ],
      },
    ])
  }

  return (
    <View style={layoutStyles.screen}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 45.478,
          longitude: 9.227,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        customMapStyle={scheme === "dark" ? darkMapStyle : lightMapStyle}
        showsCompass={false}
      />

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
            backgroundColor: fabBg,
            opacity: isGuest ? 0.7 : 1,
            shadowColor: palette.border,
            bottom: verticalScale(90) + insets.bottom,
          },
        ]}
        onPress={handleFabPress}
      >
        <Plus size={iconSizes.lg} color={iconColor} strokeWidth={2} />
      </Pressable>

      <SearchResultsSheet
        visible={resultsVisible}
        results={results}
        topOffset={insets.top + verticalScale(16)}
        onClose={() => setResultsVisible(false)}
      />
    </View>
  )
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
})
