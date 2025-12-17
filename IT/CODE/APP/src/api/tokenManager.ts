import axios from "axios"
import { getRefreshToken, setSession, clearSession, type AuthTokens } from "@/auth/authSession"

const API_BASE_URL = process.env.PROD_API_URL ?? "http://192.168.1.123:3000/api/v1"

type RefreshResponse = {
  tokens: AuthTokens
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await refreshClient.post<RefreshResponse>("/auth/refresh", { refreshToken })
      setSession(res.data.tokens)
      return res.data.tokens.accessToken
    })()
      .catch(() => {
        clearSession()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
