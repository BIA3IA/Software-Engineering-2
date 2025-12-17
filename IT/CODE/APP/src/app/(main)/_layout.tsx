import React from "react"
import { View, StyleSheet, Animated } from "react-native"
import { Slot, useRouter } from "expo-router"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { BottomNav } from "@/components/BottomNav"
import { AppPopup } from "@/components/ui/AppPopup"
import { useColorScheme } from "@/hooks/useColorScheme"
import Colors from "@/constants/Colors"
import { layoutStyles, verticalScale } from "@/theme/layout"
import { iconSizes } from "@/theme/typography"
import { Lock } from "lucide-react-native"
import { LoginPromptProvider } from "@/hooks/useLoginPrompt"
import { BottomNavVisibilityContext } from "@/hooks/useBottomNavVisibility"

export default function MainLayout() {
  const scheme = useColorScheme() ?? "light"
  const palette = Colors[scheme]
  const router = useRouter()

  const insets = useSafeAreaInsets()
  const NAV_H = verticalScale(72)

  const [loginPopupVisible, setLoginPopupVisible] = React.useState(false)
  const [navHidden, setNavHidden] = React.useState(false)
  const navTranslate = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(navTranslate, {
      toValue: navHidden ? NAV_H + insets.bottom : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [navHidden, navTranslate, insets.bottom, NAV_H])

  function openLoginPopup() {
    setLoginPopupVisible(true)
  }

  function closeLoginPopup() {
    setLoginPopupVisible(false)
  }

  function goToLogin() {
    setLoginPopupVisible(false)
    router.replace("/(auth)/login")
  }

  return (
    <BottomNavVisibilityContext.Provider value={{ setHidden: setNavHidden }}>
      <LoginPromptProvider onRequireLogin={openLoginPopup}>
        <SafeAreaView
          style={[layoutStyles.screen, { backgroundColor: palette.bgSecondary }]}
          edges={[]}
        >
          <View style={styles.mainContent}>
            <Slot />
          </View>

          <Animated.View
            style={[
              styles.bottomNavOverlay,
              {
                transform: [{ translateY: navTranslate }],
              },
            ]}
            pointerEvents={navHidden ? "none" : "auto"}
          >
            <BottomNav onRequireLogin={openLoginPopup} />
          </Animated.View>

          <AppPopup
            visible={loginPopupVisible}
            title="Log In Required"
            message="Log in to unlock all features and save your progress."
            icon={<Lock size={iconSizes.xl} color={palette.primary} strokeWidth={2.2} />}
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
    </BottomNavVisibilityContext.Provider>
  )
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  bottomNavOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
})
