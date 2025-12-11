import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Bike } from "lucide-react-native"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/hooks/useColorScheme"
import { AppButton } from "@/components/ui/AppButton"
import { useAuthStore } from "@/auth/storage"
import { textStyles } from "@/theme/typography"
import { scale, verticalScale, moderateScale } from "@/theme/layout"

export default function WelcomeScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const gradientStart = palette.gradientStart ?? "#38bdf8"
  const gradientEnd = palette.gradientEnd ?? "#0369a1"

  const titleColor = palette.titleColor
  const subtitleColor = palette.subtitleColor
  const guestTextColor = palette.subtitleColor

  function handleSignIn() {
    router.push("/(auth)/signup")
  }

  function handleLogIn() {
    router.push("/(auth)/login")
  }

  async function handleGuest() {
    await login({
      id: "guest", username: "Guest",
      email: ""
    }, "guest")
    router.replace("/(main)/home")
  }

  return (
    <LinearGradient
      colors={[gradientStart, gradientEnd]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.cardWrapper}>
          <View style={styles.cardGlow} />
          <View style={styles.card}>
            <Bike
              size={scale(120)}
              color={gradientStart}
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
            <AppButton
              title="Sign Up"
              variant="secondary"
              onPress={handleSignIn}
            />
          </View>
          <View style={[styles.button, styles.buttonSpacing]}>
            <AppButton
              title="Log In"
              variant="outline"
              onPress={handleLogIn}
            />
          </View>
          <Text
            onPress={handleGuest}
            style={[styles.guest, { color: guestTextColor }]}
          >
            Continue as Guest
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
    borderRadius: scale(115),
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  card: {
    width: scale(200),
    height: scale(200),
    borderRadius: moderateScale(40),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
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
    gap: verticalScale(12),
    marginTop: verticalScale(4),
  },
  button: {
    width: scale(240),
  },
  buttonSpacing: {
    marginTop: verticalScale(4),
  },
  guest: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    textAlign: "center",
    marginTop: verticalScale(8),
    opacity: 0.9,
  },
})
