import { create } from "zustand"
import * as SecureStore from "expo-secure-store"
import { setSession, clearSession, onSessionChange, type AuthTokens } from "./authSession"
import type { User } from "@/api/auth"
import { loginApi, signupApi, logoutApi } from "@/api/auth"

const USER_KEY = "bbp_user"
const ACCESS_TOKEN_KEY = "bbp_access_token"
const REFRESH_TOKEN_KEY = "bbp_refresh_token"

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  initAuth: () => Promise<void>
  loginWithPassword: (email: string, password: string) => Promise<void>
  signupWithPassword: (payload: { username: string; email: string; password: string; systemPreferences?: string[] }) => Promise<void>
  login: (user: User, tokens: AuthTokens) => Promise<void>
  loginAsGuest: (user: User) => void
  logout: () => Promise<void>
  setTokens: (tokens: AuthTokens | null) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => {
  onSessionChange(async (tokens) => {
    if (tokens) {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
      ])
      set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken })
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ])
      set({ accessToken: null, refreshToken: null })
    }
  })

  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: true,

    async initAuth() {
      try {
        const [userJson, accessToken, refreshToken] = await Promise.all([
          SecureStore.getItemAsync(USER_KEY),
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        ])

        if (userJson && accessToken && refreshToken) {
          const user = JSON.parse(userJson) as User

          setSession({ accessToken, refreshToken })

          set({ user, accessToken, refreshToken, loading: false })
        } else {
          clearSession()
          set({ user: null, accessToken: null, refreshToken: null, loading: false })
        }
      } catch {
        clearSession()
        set({ user: null, accessToken: null, refreshToken: null, loading: false })
      }
    },

    async setTokens(tokens) {
      setSession(tokens)
    },

    async login(user, tokens) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
      await get().setTokens(tokens)
      set({ user, loading: false })
    },

    async loginWithPassword(email, password) {
      const { user, tokens } = await loginApi(email, password)
      await get().login(user, tokens)
    },

    async signupWithPassword({ username, email, password, systemPreferences = [] }) {
      const { user, tokens } = await signupApi(username, email, password, systemPreferences)
      await get().login(user, tokens)
    },

    loginAsGuest(user) {
      clearSession()
      set({ user, accessToken: null, refreshToken: null, loading: false })
    },

    async logout() {
      const rt = get().refreshToken
      try {
        await logoutApi(rt)
      } catch (err) {
        console.warn("Failed to revoke refresh token", err)
      }

      await SecureStore.deleteItemAsync(USER_KEY)
      await get().setTokens(null)
      set({ user: null, loading: false })
    },
  }
})