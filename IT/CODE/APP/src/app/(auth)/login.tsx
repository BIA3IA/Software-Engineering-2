import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { Mail, Lock } from "lucide-react-native"

import { AppTextInput } from "@/components/ui/AppTextInput"
import { AppButton } from "@/components/ui/AppButton"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles, spacingStyles, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { useAuthStore } from "@/auth/storage"
import { loginSchema, type LoginFormValues } from "@/auth/validation"

export default function LogInScreen() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconColor = palette.textSecondary
  const fieldIconSize = iconSizes.md

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  async function onSubmit(values: LoginFormValues) {

    // ZOD validation
    const result = loginSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors

      // errors from ZOD to react-hook-form
      Object.entries(fieldErrors).forEach(([name, messages]) => {
        const message = Array.isArray(messages) ? messages[0] : undefined
        if (!message) return

        setError(name as keyof LoginFormValues, {
          type: "zod",
          message,
        })
      })

      return
    }

    // if valid -> login TODO real Login
    const valid = result.data
    const fakeUser = { id: "1", username: "Bianca", email: valid.email }
    const fakeToken = "abc123"

    await login(fakeUser, fakeToken)
    router.replace("/(main)/home")
  }

  function handleBack() {
    router.replace("/(auth)/welcome")
  }

  return (
    <View style={[layoutStyles.screen, { backgroundColor: palette.bgPrimary }]}>
      <View style={[styles.header, layoutStyles.horizontalPadding, { backgroundColor: palette.bgAccent }]}>
        <Text style={[textStyles.screenTitle, styles.headerTitle, { color: palette.titleColor }]}>
          Welcome Back
        </Text>
        <Text style={[textStyles.screenSubtitle, { color: palette.subtitleColor }]}>
          Login to continue riding with BestBikePaths
        </Text>
      </View>

      <View style={[styles.formContainer, layoutStyles.roundedTopXL, { backgroundColor: palette.bgPrimary }]}>
        <ScrollView contentContainerStyle={[styles.content, layoutStyles.horizontalPadding]} keyboardShouldPersistTaps="handled">

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <AppTextInput
                label="Email Address"
                placeholder="Enter your email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={fieldIconSize} color={iconColor} />}
                errorMessage={errors.email?.message}
              />
            )}
          />

          <View style={spacingStyles.md} />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <AppTextInput
                label="Password"
                placeholder="Enter your password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                icon={<Lock size={fieldIconSize} color={iconColor} />}
                errorMessage={errors.password?.message}
              />
            )}
          />

          <View style={spacingStyles.xl} />

          <AppButton title={isSubmitting ? "Logging In..." : "Log In"} variant="primary" onPress={handleSubmit(onSubmit)} />

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
    paddingTop: verticalScale(56),
    paddingBottom: verticalScale(42),
  },
  headerTitle: {
    marginBottom: verticalScale(4),
  },
  formContainer: {
    flex: 1,
    marginTop: -verticalScale(24),
    overflow: "hidden",
  },
  content: {
    paddingTop: verticalScale(32),
    paddingBottom: verticalScale(32),
  },
  backWrapper: {
    marginTop: verticalScale(16),
    alignItems: "center",
  },
  backText: {
    textAlign: "center",
  },
})
