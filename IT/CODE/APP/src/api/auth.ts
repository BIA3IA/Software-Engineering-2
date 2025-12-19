import { api } from "./client"

export type User = {
  id: string
  username: string
  email: string
}

export type LoginResponse = {
  user: User
  accessToken: string
  refreshToken?: string
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post("/login", { email, password })
  return res.data
}

export async function signupApi(username: string, email: string, password: string): Promise<LoginResponse> {
  const res = await api.post("/register", { username, email, password })
  return res.data
}

export async function logoutApi(): Promise<void> {
  await api.post("/logout")
}

export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const res = await api.post("/refresh")
  return res.data
}
