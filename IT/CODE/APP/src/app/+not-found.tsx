import { Stack, useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { StyleSheet, View, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { AppButton } from "@/components/ui/AppButton"
import { useAuthStore } from "@/auth/storage"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale, moderateScale, radius } from "@/theme/layout"

export default function NotFoundScreen() {
  const router = useRouter()
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)

  const homeHref = user ? "/(main)/home" : "/(auth)/welcome"

  function handleGoHome() {
    router.replace(homeHref)
  }

  return (
    <LinearGradient
      colors={[palette.gradient.from, palette.gradient.to]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.gradient}
    >
      <Stack.Screen options={{ title: "Not Found", headerShown: false }} />

      <View
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, verticalScale(24)), paddingBottom: insets.bottom + verticalScale(24) },
        ]}
      >
        <View style={styles.orbital}>
          <View style={[styles.orb, styles.orbTop, { backgroundColor: "rgba(255,255,255,0.18)" }]} />
          <View style={[styles.orb, styles.orbBottom, { backgroundColor: "rgba(255,255,255,0.12)" }]} />

          <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>
            <Text style={[styles.code, { color: palette.brand.dark }]}>404</Text>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[textStyles.heroTitle, styles.title, { color: palette.text.onAccent }]}>
            Route not found
          </Text>
          <Text style={[textStyles.bodySmall, styles.subtitle, { color: palette.text.onAccentMuted }]}>
            The screen you’re looking for doesn’t exist or has moved.
            Use the button below to return home.
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <AppButton title="Go to home" variant="primary" onPress={handleGoHome} />
          </View>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
    gap: verticalScale(28),
  },
  orbital: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    position: "absolute",
    width: scale(220),
    height: scale(220),
    borderRadius: radius.full,
  },
  orbTop: {
    transform: [{ translateY: scale(-30) }, { translateX: scale(-20) }],
  },
  orbBottom: {
    width: scale(180),
    height: scale(180),
    transform: [{ translateY: scale(40) }, { translateX: scale(30) }],
  },
  card: {
    width: scale(200),
    height: scale(200),
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: verticalScale(12),
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 24,
    elevation: 12,
  },
  code: {
    fontSize: moderateScale(52),
    fontWeight: "800",
    letterSpacing: 4,
  },
  textBlock: {
    alignItems: "center",
    gap: verticalScale(10),
  },
  title: {
    fontSize: moderateScale(34, 0.6),
  },
  subtitle: {
    textAlign: "center",
    maxWidth: scale(320),
    lineHeight: moderateScale(20),
  },
  actions: {
    width: "100%",
    gap: verticalScale(12),
  },
  actionButton: {
    width: "100%",
  },
})
