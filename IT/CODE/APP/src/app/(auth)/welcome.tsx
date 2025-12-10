import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { MaterialCommunityIcons } from "@expo/vector-icons"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"
import { AppButton } from "@/components/ui/AppButton"
import { useAuthStore } from "@/auth/storage"

export default function WelcomeScreen() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]

  const gradientStart = palette.gradientStart ?? "#38bdf8"
  const gradientEnd = palette.gradientEnd ?? "#0369a1"
  const titleColor = "#ffffff"
  const subtitleColor = "#d8e9ff"
  const guestTextColor = palette.textAccent ?? "#d0e8ff"

  function handleSignIn() {
    router.push("/(auth)/login")
  }

  function handleLogIn() {
    router.push("/(auth)/login")
  }

  async function handleGuest() {
    await login({ id: "guest", username: "Guest" }, "guest")
    router.replace("/(main)/home")
  }

  return (
    <LinearGradient colors={[gradientStart, gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.cardWrapper}>
          <View style={styles.cardGlow} />
          <View style={styles.card}>
            <MaterialCommunityIcons name="bicycle" size={92} color={gradientStart} />
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>BestBikePaths</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Discover amazing bike paths, track your rides, and join a community of cyclists
          </Text>
        </View>

        <View style={styles.buttons}>
          <View style={styles.button}>
            <AppButton title="Sign In" variant="primary" onPress={handleSignIn} />
          </View>
          <View style={[styles.button, styles.buttonSpacing]}>
            <AppButton title="Log In" variant="outline" onPress={handleLogIn} />
          </View>
        </View>

        <Text onPress={handleGuest} style={[styles.guest, { color: guestTextColor }]}>
          Continue as Guest →
        </Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 24,
  },
  cardWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    top: -28,
    bottom: -28,
    left: -28,
    right: -28,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  card: {
    width: 160,
    height: 160,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 30,
    elevation: 14,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.95,
  },
  buttons: {
    width: "100%",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  button: { width: 220 },
  buttonSpacing: { marginTop: 4 },
  guest: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.9,
  },
})
