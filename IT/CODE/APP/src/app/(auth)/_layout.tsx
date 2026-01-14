import { Slot, Redirect } from "expo-router"
import { useAuthStore } from "@/auth/storage"

export default function AuthLayout() {
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  const isGuest = user?.id === "guest"
  if (loading) return null
  if (user && !isGuest) return <Redirect href="/(main)/home" />
  return <Slot />
}
