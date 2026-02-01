import { Redirect } from "expo-router"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useAuthStore } from "@/auth/storage"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { textStyles } from "@/theme/typography"
import { scale, verticalScale } from "@/theme/layout"

export default function IndexScreen() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const isGuest = user?.id === "guest"
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  if (loading) {
    return (
      <LinearGradient
        colors={[palette.gradient.from, palette.gradient.to]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.splash}
      >
        <View style={styles.splashContent}>
          <Text style={[textStyles.heroTitle, styles.title, { color: palette.text.onAccent }]}>BBP</Text>
          <Text style={[textStyles.heroSubtitle, { color: palette.text.onAccentMuted }]}>
            Best Bike Paths
          </Text>
          <ActivityIndicator color={palette.text.onAccent} size="large" />
        </View>
      </LinearGradient>
    )
  }

  if (user && !isGuest) {
    return <Redirect href="/(main)/home" />
  }

  return <Redirect href="/(auth)/welcome" />
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
  },
  splashContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(10),
    paddingHorizontal: scale(24),
  },
  title: {
    letterSpacing: 1,
  },
})
