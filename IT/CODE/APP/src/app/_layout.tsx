import { useEffect } from "react"
import { Slot, Redirect, useSegments } from "expo-router"
import { Provider as PaperProvider } from "react-native-paper"
import { useAuthStore } from "@/auth/storage"
import { usePaperTheme } from "@/theme/paperTheme"

export default function TabsLayout() {
  const { user, loading, initAuth } = useAuthStore()
  const segments = useSegments()
  const inAuthGroup = segments[0] === "(auth)"
  const paperTheme = usePaperTheme()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <PaperProvider theme={paperTheme}>
      {loading ? null : !user && !inAuthGroup ? <Redirect href="/(auth)/welcome" /> : <Slot />}
    </PaperProvider>
  )
}
