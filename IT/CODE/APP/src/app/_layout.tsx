import { useEffect } from "react"
import { Slot, Redirect, useSegments } from "expo-router"
import { Provider as PaperProvider } from "react-native-paper"
import { useAuthStore } from "@/auth/storage"
import { usePaperTheme } from "@/theme/paperTheme"
import { LucideIcon } from "@/components/icons/LucideIcon"

export default function TabsLayout() {
  const { user, loading, initAuth } = useAuthStore()
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
      {loading ? null : !user && !inAuthGroup ? <Redirect href="/(auth)/welcome" /> : <Slot />}
    </PaperProvider>
  )
}
