import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { useAuthStore } from "@/auth/storage"
import { AppButton } from "@/components/ui/AppButton"

export default function SigninScreen() {
  const login = useAuthStore((s) => s.login)
  const router = useRouter()

  async function handleLogin() {
    const fakeUser = { id: "1", username: "Bianca" }
    const fakeToken = "abc123"

    await login(fakeUser, fakeToken)
    router.replace("/")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <AppButton title="Login fake" variant="primary" onPress={handleLogin} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
})
