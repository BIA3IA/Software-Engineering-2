import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import { refreshAccessToken } from "./tokenManager"
import { getAccessToken } from "@/auth/authSession"
import { beginMutation, endMutation } from "@/state/mutationTracker"

const API_BASE_URL =
  process.env.EXPO_PUBLIC_PROD_API_URL ?? process.env.EXPO_PUBLIC_DEVEL_API_URL

type RequestConfigWithRetry = InternalAxiosRequestConfig & {
  _retry?: boolean
  _mutationTracked?: boolean
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

function isMutationMethod(method?: string) {
  if (!method) return false
  const normalized = method.toLowerCase()
  return ["post", "put", "patch", "delete"].includes(normalized)
}

api.interceptors.request.use((config) => {
  const trackedConfig = config as RequestConfigWithRetry
  if (isMutationMethod(trackedConfig.method) && !trackedConfig._mutationTracked) {
    beginMutation()
    trackedConfig._mutationTracked = true
  }

  const token = getAccessToken()
  if (token) {
    trackedConfig.headers = trackedConfig.headers ?? {}
    trackedConfig.headers.Authorization = `Bearer ${token}`
  }
  return trackedConfig
})

api.interceptors.response.use(
  (res) => {
    const trackedConfig = res.config as RequestConfigWithRetry | undefined
    if (trackedConfig?._mutationTracked) {
      endMutation()
    }
    return res
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined

    if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      originalRequest.headers = originalRequest.headers ?? {}

      const newToken = await refreshAccessToken()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }
    }

    if (originalRequest?._mutationTracked) {
      endMutation()
    }

    return Promise.reject(error)
  }
)
