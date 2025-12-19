import React from "react"
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Controller, useForm } from "react-hook-form"
import { UserRound, Mail, Lock, X, CheckCircle, AlertTriangle } from "lucide-react-native"

import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { iconSizes } from "@/theme/typography"
import { radius, scale, verticalScale } from "@/theme/layout"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { AppTextInput } from "@/components/ui/AppTextInput"
import { AppButton } from "@/components/ui/AppButton"
import { useAuthStore } from "@/auth/storage"
import { editProfileSchema } from "@/validation"
import { AppPopup } from "@/components/ui/AppPopup"
import { BottomNavVisibilityContext } from "@/hooks/useBottomNavVisibility"
import { getApiErrorMessage } from "@/utils/apiError"

type EditProfileFormValues = {
  username: string
  email: string
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export default function EditProfileScreen() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const bottomNavVisibility = React.useContext(BottomNavVisibilityContext)
  const defaultUsername = user?.username ?? user?.email?.split("@")[0] ?? "Guest"
  const defaultEmail = user?.email ?? "guest@bestbikepaths.com"
  const [isSuccessPopupVisible, setSuccessPopupVisible] = React.useState(false)
  const [isErrorPopupVisible, setErrorPopupVisible] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState("Your changes have been saved successfully.")
  const [errorMessage, setErrorMessage] = React.useState("Unable to save your changes.")
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<EditProfileFormValues>({
    defaultValues: {
      username: defaultUsername,
      email: defaultEmail,
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  React.useEffect(() => {
    bottomNavVisibility?.setHidden(true)
    return () => {
      bottomNavVisibility?.setHidden(false)
    }
  }, [bottomNavVisibility])


  function mapValidationErrors(fieldErrors: Record<string, string[] | undefined>) {
    Object.entries(fieldErrors).forEach(([name, messages]) => {
      const message = Array.isArray(messages) ? messages[0] : undefined
      if (!message) return

      setError(name as keyof EditProfileFormValues, {
        type: "zod",
        message,
      })
    })
  }

  async function onSubmit(values: EditProfileFormValues) {
    const result = editProfileSchema.safeParse({
      username: values.username,
      email: values.email,
      currentPassword: values.currentPassword.trim() ? values.currentPassword : undefined,
      newPassword: values.newPassword.trim() ? values.newPassword : undefined,
      confirmNewPassword: values.confirmNewPassword.trim() ? values.confirmNewPassword : undefined,
    })

    if (!result.success) {
      mapValidationErrors(result.error.flatten().fieldErrors)
      return
    }

    try {
      const serverMessage =
        (await updateProfile({
          username: result.data.username,
          email: result.data.email,
          password: result.data.newPassword,
        })) ?? "Profile updated successfully"

      reset({
        username: result.data.username,
        email: result.data.email,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      })
      setSuccessMessage(serverMessage)
      setSuccessPopupVisible(true)
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to update the profile.")
      setErrorMessage(message)
      setErrorPopupVisible(true)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.surface.screen }}
      contentContainerStyle={{ paddingBottom: verticalScale(32) + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Edit Profile"
        subtitle="Manage your account details"
        showSortButton={false}
        trailingAccessory={
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: palette.button.secondary.bg, shadowColor: palette.border.muted },
              pressed && { opacity: 0.9 },
            ]}
          >
            <X size={iconSizes.md} color={palette.button.secondary.text} />
          </Pressable>
        }
      />

      <View style={styles.sectionsWrapper}>
        <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>

          <Controller
            control={control}
            name="username"
            render={({ field }) => (
              <AppTextInput
                label="Username"
                placeholder="Enter your username"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                icon={<UserRound size={iconSizes.md} color={palette.text.secondary} />}
                errorMessage={errors.username?.message}
              />
            )}
          />

          <View style={styles.fieldSpacing} />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <AppTextInput
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                icon={<Mail size={iconSizes.md} color={palette.text.secondary} />}
                errorMessage={errors.email?.message}
              />
            )}
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface.card, shadowColor: palette.border.muted }]}>

          <Controller
            control={control}
            name="currentPassword"
            render={({ field }) => (
              <AppTextInput
                label="Current Password"
                placeholder="Enter your current password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                icon={<Lock size={iconSizes.md} color={palette.text.secondary} />}
                errorMessage={errors.currentPassword?.message}
              />
            )}
          />

          <View style={styles.fieldSpacing} />

          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => (
              <AppTextInput
                label="New Password"
                placeholder="Create a new password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                icon={<Lock size={iconSizes.md} color={palette.text.secondary} />}
                errorMessage={errors.newPassword?.message}
              />
            )}
          />

          <View style={styles.fieldSpacing} />

          <Controller
            control={control}
            name="confirmNewPassword"
            render={({ field }) => (
              <AppTextInput
                label="Confirm Password"
                placeholder="Re-enter your new password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                icon={<Lock size={iconSizes.md} color={palette.text.secondary} />}
                errorMessage={errors.confirmNewPassword?.message}
              />
            )}
          />
        </View>

        <View style={styles.actions}>
          <View style={styles.actionButton}>
            <AppButton
              title={isSubmitting ? "Saving..." : "Save Changes"}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
            />
          </View>
          <View style={styles.actionButton}>
            <AppButton title="Cancel" variant="secondary" onPress={() => router.back()} />
          </View>
        </View>

        <AppPopup
          visible={isSuccessPopupVisible}
          title="Profile Updated"
          message={successMessage}
          icon={<CheckCircle size={iconSizes.xl} color={palette.status.success} />}
          iconBackgroundColor={`${palette.accent.green.surface}`}
          onClose={() => setSuccessPopupVisible(false)}
          primaryButton={{
            label: "Great!",
            variant: "primary",
            onPress: () => setSuccessPopupVisible(false),
            buttonColor: palette.status.success,
            textColor: palette.text.onAccent,
          }}
        />
        <AppPopup
          visible={isErrorPopupVisible}
          title="Update Failed"
          message={errorMessage}
          icon={<AlertTriangle size={iconSizes.xl} color={palette.status.danger} />}
          iconBackgroundColor={`${palette.accent.red.surface}`}
          onClose={() => setErrorPopupVisible(false)}
          primaryButton={{
            label: "OK",
            variant: "primary",
            onPress: () => setErrorPopupVisible(false),
            buttonColor: palette.status.danger,
            textColor: palette.text.onAccent,
          }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  sectionsWrapper: {
    marginTop: -verticalScale(40),
    paddingHorizontal: scale(20),
    gap: verticalScale(18),
  },
  card: {
    borderRadius: radius.xl,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(16),
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: radius.xl,
    elevation: 4,
  },
  fieldSpacing: {
    height: verticalScale(12),
  },
  actions: {
    flexDirection: "row",
    gap: scale(12),
  },
  actionButton: {
    flex: 1,
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
})
