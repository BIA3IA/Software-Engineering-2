import { create } from "zustand"
import * as SecureStore from "expo-secure-store"

import type { User } from "@/api/auth"

type AuthState = {
  user: User | null
  accessToken: string | null
  loading: boolean
  initAuth: () => Promise<void>
  login: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
}

const USER_KEY = "bbp_user"
const TOKEN_KEY = "bbp_access_token"

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  loading: true,

  async initAuth() {
    try {
      const [userJson, token] = await Promise.all([
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(TOKEN_KEY),
      ])

      if (userJson && token) {
        const user = JSON.parse(userJson) as User
        set({ user, accessToken: token, loading: false })
      } else {
        set({ user: null, accessToken: null, loading: false })
      }
    } catch (err) {
      set({ user: null, accessToken: null, loading: false })
    }
  },

  async login(user, token) {
    await Promise.all([
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      SecureStore.setItemAsync(TOKEN_KEY, token),
    ])
    set({ user, accessToken: token })
  },

  async logout() {
    await Promise.all([
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync(TOKEN_KEY),
    ])
    set({ user: null, accessToken: null })
  },
}))
