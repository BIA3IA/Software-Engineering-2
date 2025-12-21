import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { Mail, Lock, AlertTriangle } from "lucide-react-native"

import { AppTextInput } from "@/components/ui/AppTextInput"
import { AppButton } from "@/components/ui/AppButton"
import { AppPopup } from "@/components/ui/AppPopup"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles, spacingStyles, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { useAuthStore } from "@/auth/storage"
import { loginSchema, type LoginFormValues } from "@/validation"
import { getApiErrorMessage } from "@/utils/apiError"

export default function LogInScreen() {
  const router = useRouter()
  const login = useAuthStore((s) => s.loginWithPassword)
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const iconColor = palette.text.secondary
  const fieldIconSize = iconSizes.md
  const [errorPopup, setErrorPopup] = React.useState({
    visible: false,
    title: "",
    message: "",
  })

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

    const valid = result.data

    try {
      await login(valid.email, valid.password)
      router.replace("/(main)/home")
    } catch (error) {
      const message = getApiErrorMessage(error, "Check your credentials and try again.")
      setErrorPopup({
        visible: true,
        title: "Login failed",
        message,
      })
    }
  }

  function handleBack() {
    router.replace("/(auth)/welcome")
  }

  function handleClosePopup() {
    setErrorPopup((prev) => ({
      ...prev,
      visible: false,
    }))
  }

  return (
    <>
      <View style={[layoutStyles.screen, { backgroundColor: palette.surface.screen }]}>
        <View style={[styles.header, layoutStyles.horizontalPadding, { backgroundColor: palette.surface.accent }]}>
          <Text style={[textStyles.screenTitle, styles.headerTitle, { color: palette.text.onAccent }]}>
            Welcome Back
          </Text>
          <Text style={[textStyles.screenSubtitle, { color: palette.text.onAccentMuted }]}>
            Login to continue riding with BestBikePaths
          </Text>
        </View>

        <View style={[styles.formContainer, layoutStyles.roundedTopXL, { backgroundColor: palette.surface.card }]}>
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
              <Text style={[textStyles.bodyBold, styles.backText, { color: palette.text.secondary }]} onPress={handleBack}>
                Back to Welcome
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
      <AppPopup
        visible={errorPopup.visible}
        title={errorPopup.title || "Error"}
        message={errorPopup.message || "Unable to complete the request."}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
        iconBackgroundColor={`${palette.accent.red.surface}`}
        onClose={handleClosePopup}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: handleClosePopup,
          buttonColor: palette.status.danger,
          textColor: palette.text.onAccent,
        }}
      />
    </>
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
