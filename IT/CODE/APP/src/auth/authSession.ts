export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

let accessToken: string | null = null
let refreshToken: string | null = null

let listener: ((tokens: AuthTokens | null) => void) | null = null

export function setSession(tokens: AuthTokens | null) {
  accessToken = tokens?.accessToken ?? null
  refreshToken = tokens?.refreshToken ?? null
  listener?.(tokens)
}

export function clearSession() {
  accessToken = null
  refreshToken = null
  listener?.(null)
}

export function getAccessToken() {
  return accessToken
}

export function getRefreshToken() {
  return refreshToken
}

export function onSessionChange(cb: (tokens: AuthTokens | null) => void) {
  listener = cb
  return () => {
    if (listener === cb) listener = null
  }
}
