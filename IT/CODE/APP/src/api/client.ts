import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { refreshAccessToken } from "./tokenManager"
import { getAccessToken } from "@/auth/authSession"

const API_BASE_URL =
  process.env.EXPO_PUBLIC_PROD_API_URL ?? process.env.EXPO_PUBLIC_DEVEL_API_URL

type RequestConfigWithRetry = InternalAxiosRequestConfig & { _retry?: boolean }

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      originalRequest.headers = originalRequest.headers ?? {}

      const newToken = await refreshAccessToken()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }

    return Promise.reject(error)
  }
)
