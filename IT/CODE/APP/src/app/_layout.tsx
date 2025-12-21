import { useEffect } from "react"
import { Slot, Redirect, useSegments } from "expo-router"
import { Provider as PaperProvider } from "react-native-paper"
import { useAuthStore } from "@/auth/storage"
import { usePaperTheme } from "@/theme/paperTheme"
import { LucideIcon } from "@/components/icons/LucideIcon"

export default function RootLayout() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const initAuth = useAuthStore((s) => s.initAuth)
  const isGuest = user?.id === "guest"

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
    </PaperProvider>
  )
}
