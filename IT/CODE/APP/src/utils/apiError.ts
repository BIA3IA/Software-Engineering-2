import axios from "axios"

type ApiErrorPayload = {
  message?: string
  code?: string
}

type ApiErrorResponse = {
  success?: boolean
  message?: string
  error?: ApiErrorPayload
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined
    if (data?.error?.message && typeof data.error.message === "string") {
      return data.error.message
    }
    if (data?.message && typeof data.message === "string") {
      return data.message
    }
  } else if (error instanceof Error && error.message) {
    return error.message
  }

  return fallbackMessage
}
