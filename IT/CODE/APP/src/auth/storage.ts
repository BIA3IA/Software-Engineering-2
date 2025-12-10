import { create } from "zustand"
import * as SecureStore from "expo-secure-store"

type User = {
  id: string
  username: string
}

type AuthState = {
  user: User | null
  loading: boolean
  initAuth: () => Promise<void>
  login: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initAuth: async () => {
    const token = await SecureStore.getItemAsync("bbp_token")

    if (!token) {
      set({ user: null, loading: false })
      return
    }

    set({
      user: { id: "1", username: "Guest" },
      loading: false,
    })
  },

  login: async (user, token) => {
    await SecureStore.setItemAsync("bbp_token", token)
    set({ user })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("bbp_token")
    set({ user: null })
  },
}))
