import axios from "axios"
import { getRefreshToken, setSession, clearSession, type AuthTokens } from "@/auth/authSession"

const API_BASE_URL = process.env.EXPO_PUBLIC_PROD_API_URL ?? process.env.EXPO_PUBLIC_DEVEL_API_URL

type RefreshResponse = {
  tokens: AuthTokens
}

type RefreshClient = ReturnType<typeof axios.create>

let refreshClient: RefreshClient | null = null
let refreshPromise: Promise<string | null> | null = null

function getRefreshClient() {
  if (!refreshClient) {
    refreshClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    })
  }
  return refreshClient
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    console.warn("refreshAccessToken: missing refresh token")
    return null
  }

  if (!refreshPromise) {
    const client = getRefreshClient()
    refreshPromise = (async () => {
      const res = await client.post<RefreshResponse>("/auth/refresh", { refreshToken })
      setSession(res.data.tokens)
      return res.data.tokens.accessToken
    })()
      .catch((error) => {
        console.warn("refreshAccessToken: failed, clearing session", error)
        clearSession()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
