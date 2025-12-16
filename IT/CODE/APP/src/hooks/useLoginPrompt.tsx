import React, { createContext, useContext } from "react"

type LoginPromptContextValue = () => void

const LoginPromptContext = createContext<LoginPromptContextValue>(() => {})

type ProviderProps = {
  children: React.ReactNode
  onRequireLogin: LoginPromptContextValue
}

export function LoginPromptProvider({ children, onRequireLogin }: ProviderProps) {
  return <LoginPromptContext.Provider value={onRequireLogin}>{children}</LoginPromptContext.Provider>
}

export function useLoginPrompt() {
  return useContext(LoginPromptContext)
}

