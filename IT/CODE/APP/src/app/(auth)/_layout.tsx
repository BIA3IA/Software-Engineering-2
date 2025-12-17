import { Slot, Redirect } from "expo-router"
import { useAuthStore } from "@/auth/storage"

export default function AuthLayout() {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (user) return <Redirect href="/(main)/home" />
  return <Slot />
}
