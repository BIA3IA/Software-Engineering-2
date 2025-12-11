import React, { useState } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { User, Mail, Lock, LockKeyhole } from "lucide-react-native"

import { AppTextInput } from "@/components/ui/AppTextInput"
import { AppButton } from "@/components/ui/AppButton"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles, spacingStyles } from "@/theme/layout"
import { textStyles } from "@/theme/typography"

export default function SignUpScreen() {
  const router = useRouter()
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconColor = palette.textSecondary

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  function handleSubmit() {
    // TODO: chiamata API
  }

  function handleBack() {
    router.back()
  }

  return (
    <View style={[layoutStyles.screen, { backgroundColor: palette.bgPrimary }]}>
      <View style={[styles.header, layoutStyles.horizontalPadding, { backgroundColor: palette.gradientStart }]}>
        <Text style={[textStyles.screenTitle, styles.headerTitle, { color: palette.titleColor }]}>
          Create Account
        </Text>
        <Text style={[textStyles.screenSubtitle, { color: palette.subtitleColor }]}>
          Join BestBikePaths today
        </Text>
      </View>

      <View style={[styles.formContainer, layoutStyles.roundedTopXL, { backgroundColor: palette.bgPrimary }]}>
        <ScrollView contentContainerStyle={[styles.content, layoutStyles.horizontalPadding]} keyboardShouldPersistTaps="handled">
          <AppTextInput
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            icon={<User size={20} color={iconColor} />}
          />

          <View style={spacingStyles.md} />

          <AppTextInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail size={20} color={iconColor} />}
          />

          <View style={spacingStyles.md} />

          <AppTextInput
            label="Password"
            placeholder="Create a secure password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color={iconColor} />}
          />

          <View style={spacingStyles.md} />

          <AppTextInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            icon={<LockKeyhole size={20} color={iconColor} />}
          />

          <View style={spacingStyles.xl} />

          <AppButton
            title="Sign Up"
            variant="primary"
            onPress={handleSubmit}
          />

          <View style={styles.backWrapper}>
            <Text style={[textStyles.bodyBold, styles.backText, { color: palette.textSecondary }]} onPress={handleBack}>
              Back to Welcome
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingBottom: 42,
  },
  headerTitle: {
    marginBottom: 4,
  },
  formContainer: {
    flex: 1,
    marginTop: -24,
    overflow: "hidden",
  },
  content: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  backWrapper: {
    marginTop: 24,
    alignItems: "center",
  },
  backText: {
    textAlign: "center",
  },
})
