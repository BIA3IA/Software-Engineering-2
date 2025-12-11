import React from "react"
import { View, StyleSheet } from "react-native"
import { Slot, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"

import { BottomNav } from "@/components/BottomNav"
import { AppPopup } from "@/components/ui/AppPopup"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles } from "@/theme/layout"
import { Lock } from "lucide-react-native"
import { LoginPromptProvider } from "@/hooks/useLoginPrompt"

export default function MainLayout() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const router = useRouter()

  const [loginPopupVisible, setLoginPopupVisible] = React.useState(false)

  function openLoginPopup() {
    setLoginPopupVisible(true)
  }

  function closeLoginPopup() {
    setLoginPopupVisible(false)
  }

  function goToLogin() {
    setLoginPopupVisible(false)
    router.push("/(auth)/login")
  }

  return (
    <LoginPromptProvider onRequireLogin={openLoginPopup}>
      <SafeAreaView style={[layoutStyles.screen, { backgroundColor: palette.bgAccent }]} edges={[]}>
        <View style={styles.mainContent}>
          <Slot />
        </View>

        <BottomNav onRequireLogin={openLoginPopup} />

        <AppPopup
          visible={loginPopupVisible}
          title="Log In Required"
          message="Log in to unlock all features and save your progress."
          icon={<Lock size={32} color={palette.primary} strokeWidth={2.2} />}
          iconBackgroundColor={palette.bgElevated}
          onClose={closeLoginPopup}
          primaryButton={{
            label: "Log In",
            onPress: goToLogin,
            variant: "primary",
          }}
        />
      </SafeAreaView>
    </LoginPromptProvider>
  )
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
})
