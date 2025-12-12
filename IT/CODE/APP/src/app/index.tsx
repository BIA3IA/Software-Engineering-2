import { Redirect } from "expo-router"
import { useAuthStore } from "@/auth/storage"

export default function Index() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return null
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />
  }

  // return <Redirect href="/(main)/home" />

  return <Redirect href="/(auth)/welcome" />
}
