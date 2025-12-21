import { Slot, Redirect } from "expo-router"
import { useAuthStore } from "@/auth/storage"

export default function AuthLayout() {
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  if (loading) return null
  if (user) return <Redirect href="/(main)/home" />
  return <Slot />
}
