import { useEffect } from "react"
import { Redirect } from "expo-router"
import { useAuthStore } from "@/auth/storage"

export default function Index() {
  const { user, loading, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  if (loading) {
    return null
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />
  }

  return <Redirect href="/(auth)/welcome" />
}
