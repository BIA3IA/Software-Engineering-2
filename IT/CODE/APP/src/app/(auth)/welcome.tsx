import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Bike } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { AppButton } from "@/components/ui/AppButton"
import { useAuthStore } from "@/auth/storage"
import { textStyles, iconSizes } from "@/theme/typography"
import { scale, verticalScale, moderateScale, radius } from "@/theme/layout"

export default function WelcomeScreen() {
  const router = useRouter()
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const titleColor = palette.text.onAccent
  const subtitleColor = palette.text.onAccentMuted
  const guestTextColor = palette.text.onAccentMuted

  function handleSignIn() {
    router.push("/(auth)/signup")
  }

  function handleLogIn() {
    router.push("/(auth)/login")
  }

  function handleGuest() {
    loginAsGuest({
      id: "guest",
      username: "Guest",
      email: "",
    })
    router.replace("/(main)/home")
  }

  return (
    <LinearGradient
      colors={[palette.gradient.from, palette.gradient.to]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.cardWrapper}>
          <View style={styles.cardGlow} />
          <View
            style={[
              styles.card,
              { backgroundColor: palette.surface.card, shadowColor: palette.border.muted },
            ]}
          >
            <Bike
              size={iconSizes.hero}
              color={palette.brand.base}
              strokeWidth={1.8}
            />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[textStyles.heroTitle, styles.title, { color: titleColor }]}>
            BestBikePaths
          </Text>
          <Text style={[textStyles.heroSubtitle, styles.subtitle, { color: subtitleColor }]}>
            Discover amazing bike paths, track your rides, and join a community
            of cyclists
          </Text>
        </View>

        <View style={styles.buttons}>
          <View style={styles.button}>
            <AppButton title="Sign Up" variant="primary" onPress={handleSignIn} />
          </View>
          <View style={[styles.button]}>
            <AppButton title="Log In" variant="secondary" onPress={handleLogIn} />
          </View>
          <Text onPress={handleGuest} style={[textStyles.bodyBold, styles.guest, { color: guestTextColor }]}>
            Guest Mode
          </Text>
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
    justifyContent: "flex-start",
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(96),
    paddingBottom: verticalScale(40),
    gap: verticalScale(32),
  },
  cardWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },
  cardGlow: {
    position: "absolute",
    width: scale(230),
    height: scale(230),
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  card: {
    width: scale(200),
    height: scale(200),
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 30,
    elevation: 14,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: scale(16),
    gap: verticalScale(10),
    marginBottom: verticalScale(12),
  },
  title: {
    fontSize: moderateScale(40, 0.7),
  },
  subtitle: {
    fontSize: moderateScale(14),
  },
  buttons: {
    width: "100%",
    alignItems: "center",
    gap: verticalScale(16),
  },
  button: {
    width: scale(240),
  },
  guest: {
    textAlign: "center",
  },
})
