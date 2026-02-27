import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import { Slot, Redirect, useSegments } from "expo-router"
import { Provider as PaperProvider } from "react-native-paper"
import { useAuthStore } from "@/auth/storage"
import { usePaperTheme } from "@/theme/paperTheme"
import { LucideIcon } from "@/components/icons/LucideIcon"
import { useIsMutationBlocking } from "@/state/mutationTracker"

export default function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const initAuth = useAuthStore((s) => s.initAuth)
  const isGuest = user?.id === "guest"
  const isMutationBlocking = useIsMutationBlocking()

  const segments = useSegments()
  const inAuthGroup = segments[0] === "(auth)"
  const paperTheme = usePaperTheme()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        icon: (props) => <LucideIcon name={props.name} color={props.color} size={props.size} />,
      }}
    >
      <Slot />

      {!loading && !user && !inAuthGroup ? (
        <Redirect href="/(auth)/welcome" />
      ) : null}

      {!loading && user && !isGuest && inAuthGroup ? (
        <Redirect href="/(main)/home" />
      ) : null}

      {isMutationBlocking ? (
        <View
          style={[styles.mutationOverlay, { backgroundColor: "transparent" }]}
          pointerEvents="auto"
        />
      ) : null}
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  mutationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
})
