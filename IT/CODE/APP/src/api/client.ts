import axios from "axios"
import { useAuthStore } from "@/auth/storage"

export const api = axios.create({
  baseURL: "https://backend.example.com/api",
  timeout: 10000,
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
