import { api } from "./client"

export type User = {
  id: string
  username: string
  email: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

type UserResponse = {
  userId: string
  username: string
  email: string
}

type LoginResponse = {
  user: UserResponse
  tokens: AuthTokens
}

type RefreshResponse = {
  tokens: AuthTokens
}

const AUTH_BASE = "/auth"
const USERS_BASE = "/users"

function mapUser(user: UserResponse): User {
  return {
    id: user.userId,
    username: user.username,
    email: user.email,
  }
}

export async function loginApi(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await api.post<LoginResponse>(`${AUTH_BASE}/login`, { email, password })
  return {
    user: mapUser(res.data.user),
    tokens: res.data.tokens,
  }
}

export async function signupApi(
  username: string,
  email: string,
  password: string,
  systemPreferences: string[] = []
): Promise<{ user: User; tokens: AuthTokens }> {
  await api.post(`${USERS_BASE}/register`, { username, email, password, systemPreferences })
  console.log("User registered successfully")
  return loginApi(email, password)
}

export async function logoutApi(refreshToken: string | null): Promise<void> {
  if (!refreshToken) return
  await api.post(`${AUTH_BASE}/logout`, { refreshToken })
}

export async function refreshTokenApi(refreshToken: string): Promise<AuthTokens> {
  const res = await api.post<RefreshResponse>(`${AUTH_BASE}/refresh`, { refreshToken })
  return res.data.tokens
}
