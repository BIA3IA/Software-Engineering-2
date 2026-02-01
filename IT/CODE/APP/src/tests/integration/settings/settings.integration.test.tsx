import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import { Linking } from "react-native"
import SettingsScreen from "@/app/(main)/settings"
import { mockRouter } from "@/jest.setup"

const mockSetThemePreference = jest.fn()
const mockSetPrivacyPreference = jest.fn()
const mockLogout = jest.fn().mockResolvedValue(undefined)
const mockUpdateProfile = jest.fn().mockResolvedValue("ok")
let mockUser: { id: string; systemPreferences?: string[] } | null = { id: "user-1" }

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
  useAuthStore: (selector: any) =>
    selector({
      user: mockUser,
      logout: mockLogout,
      updateProfile: mockUpdateProfile,
    }),
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
    mockUser = { id: "user-1" }
    jest.spyOn(Linking, "openURL").mockResolvedValueOnce(undefined as any)
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

  test("logout button works via testID", async () => {
    const { getByTestId, findByText } = render(<SettingsScreen />)

    fireEvent.press(getByTestId("settings-logout"))
    expect(await findByText("Log Out?")).toBeTruthy()
  })

  test("back button calls router.back", () => {
    const { getByTestId } = render(<SettingsScreen />)

    fireEvent.press(getByTestId("settings-back"))

    expect(mockRouter.back).toHaveBeenCalled()
  })

  test("get help opens mail client", async () => {
    const { getByTestId } = render(<SettingsScreen />)

    fireEvent.press(getByTestId("settings-help"))

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled()
    })
  })

  test("loads preferences from user systemPreferences", async () => {
    mockUser = {
      id: "user-1",
      systemPreferences: ["appearance:dark", "privacy:private"],
    }

    render(<SettingsScreen />)

    await waitFor(() => {
      expect(mockSetThemePreference).toHaveBeenCalledWith("dark")
      expect(mockSetPrivacyPreference).toHaveBeenCalledWith("private")
    })
  })
})
