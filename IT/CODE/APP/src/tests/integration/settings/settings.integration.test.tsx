import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import SettingsScreen from "@/app/(main)/settings"
import { mockRouter } from "@/jest.setup"

const mockSetThemePreference = jest.fn()
const mockSetPrivacyPreference = jest.fn()
const mockLogout = jest.fn().mockResolvedValue(undefined)

jest.mock("@/hooks/useColorScheme", () => ({
  useColorScheme: () => "light",
  useThemePreference: () => "light",
  useSetThemePreference: () => mockSetThemePreference,
}))

jest.mock("@/hooks/usePrivacyPreference", () => ({
  usePrivacyPreference: () => "public",
  useSetPrivacyPreference: () => mockSetPrivacyPreference,
}))

jest.mock("@/auth/storage", () => ({
  useAuthStore: (selector: any) => selector({ logout: mockLogout }),
}))

jest.mock("@/components/ui/SelectionOverlay", () => {
  const React = require("react")
  const { Pressable, Text, View } = require("react-native")
  return {
    SelectionOverlay: ({ visible, options, onSelect }: any) =>
      visible
        ? React.createElement(
            View,
            null,
            options.map((opt: any) =>
              React.createElement(
                Pressable,
                { key: opt.key, onPress: () => onSelect(opt.key) },
                React.createElement(Text, null, opt.label)
              )
            )
          )
        : null,
  }
})

describe("settings integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("logout confirms and navigates to welcome", async () => {
    const { getByText, findByText } = render(<SettingsScreen />)

    fireEvent.press(getByText("Log Out"))

    expect(await findByText("Log Out?")).toBeTruthy()

    fireEvent.press(getByText("Yes, Log Out"))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
      expect(mockRouter.replace).toHaveBeenCalledWith("/(auth)/welcome")
    })
  })
})
