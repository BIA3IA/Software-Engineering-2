import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { User, Mail, Lock, LockKeyhole, AlertTriangle } from "lucide-react-native"

import { AppTextInput } from "@/components/ui/AppTextInput"
import { AppButton } from "@/components/ui/AppButton"
import { AppPopup } from "@/components/ui/AppPopup"
import { useColorScheme, useThemePreference } from "@/hooks/useColorScheme"
import { usePrivacyPreference } from "@/hooks/usePrivacyPreference"
import Colors from "@/constants/Colors"
import { layoutStyles, spacingStyles, verticalScale } from "@/theme/layout"
import { textStyles, iconSizes } from "@/theme/typography"
import { signupSchema, type SignupFormValues } from "@/auth/validation"
import { useAuthStore } from "@/auth/storage"
import { getApiErrorMessage } from "@/utils/apiError"

export default function SignUpScreen() {
  const router = useRouter()
  const signup = useAuthStore((s) => s.signupWithPassword)
  const scheme = useColorScheme() ?? "light"
  const appearancePreference = useThemePreference()
  const defaultPrivacyPreference = usePrivacyPreference()
  const palette = Colors[scheme]
  const iconColor = palette.textSecondary
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
  } = useForm<SignupFormValues>({
    defaultValues: {
      email: "",
      password: "",
      username: "",
      confirm: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  async function onSubmit(values: SignupFormValues) {

    // ZOD validation
    const result = signupSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors

      // errors from ZOD to react-hook-form
      Object.entries(fieldErrors).forEach(([name, messages]) => {
        const message = Array.isArray(messages) ? messages[0] : undefined
        if (!message) return

        setError(name as keyof SignupFormValues, {
          type: "zod",
          message,
        })
      })

      return
    }

    const valid = result.data

    try {
      await signup({
        username: valid.username,
        email: valid.email,
        password: valid.password,
        systemPreferences: [
          `appearance:${appearancePreference}`,
          `privacy:${defaultPrivacyPreference}`,
        ],
      })

      console.log("User signed up successfully")
      router.replace("/(main)/home")
    } catch (error) {
      const message = getApiErrorMessage(error, "Check the data you entered and try again.")

      setErrorPopup({
        visible: true,
        title: "Sign up failed",
        message,
      })
    }
  }

  function handleBack() {
    router.replace("/(auth)/welcome")
  }

  function handleClosePopup() {
    setErrorPopup({
      visible: false,
      title: "",
      message: "",
    })
  }

  return (
    <>
      <View style={[layoutStyles.screen, { backgroundColor: palette.bgPrimary }]}>
        <View style={[styles.header, layoutStyles.horizontalPadding, { backgroundColor: palette.bgAccent }]}>
          <Text style={[textStyles.screenTitle, styles.headerTitle, { color: palette.titleColor }]}>
            Create Account
          </Text>
          <Text style={[textStyles.screenSubtitle, { color: palette.subtitleColor }]}>
            Join BestBikePaths today
          </Text>
        </View>

        <View style={[styles.formContainer, layoutStyles.roundedTopXL, { backgroundColor: palette.bgPrimary }]}>
          <ScrollView contentContainerStyle={[styles.content, layoutStyles.horizontalPadding]} keyboardShouldPersistTaps="handled">
            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <AppTextInput
                  label="Username"
                  placeholder="Choose a username"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  icon={<User size={fieldIconSize} color={iconColor} />}
                  errorMessage={errors.username?.message}
                />
              )}
            />

            <View style={spacingStyles.md} />

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
                  placeholder="Create a secure password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  icon={<Lock size={fieldIconSize} color={iconColor} />}
                  errorMessage={errors.password?.message}
                />
              )}
            />

            <View style={spacingStyles.md} />

            <Controller
              control={control}
              name="confirm"
              render={({ field }) => (
                <AppTextInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry
                  icon={<LockKeyhole size={fieldIconSize} color={iconColor} />}
                  errorMessage={errors.confirm?.message}
                />
              )}
            />

            <View style={spacingStyles.xl} />

            <AppButton title={isSubmitting ? "Creating Account..." : "Sign Up"} variant="primary" onPress={handleSubmit(onSubmit)} />

            <View style={styles.backWrapper}>
              <Text style={[textStyles.bodyBold, styles.backText, { color: palette.textSecondary }]} onPress={handleBack}>
                Back to Welcome
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
      <AppPopup
        visible={errorPopup.visible}
        title={errorPopup.title || "Error"}
        message={errorPopup.message || "Unable to complete the registration."}
        icon={<AlertTriangle size={iconSizes.xl} color={palette.red} />}
        iconBackgroundColor={`${palette.red}22`}
        onClose={handleClosePopup}
        primaryButton={{
          label: "OK",
          variant: "primary",
          onPress: handleClosePopup,
          buttonColor: palette.red,
          textColor: palette.textInverse,
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
