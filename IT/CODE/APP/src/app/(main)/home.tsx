import React from "react"
import { View, StyleSheet, Pressable } from "react-native"
import MapView from "react-native-maps"
import { Plus } from "lucide-react-native"

import { layoutStyles, scale, verticalScale, radius } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { useAuthStore } from "@/auth/storage"
import { useLoginPrompt } from "@/hooks/useLoginPrompt"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function HomeScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"
  const requireLogin = useLoginPrompt()
  const insets = useSafeAreaInsets()

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
      />

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
    </View>
  )
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
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
