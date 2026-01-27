import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import ProfileScreen from "@/app/(main)/profile"

let mockUser: { id: string; username?: string; email?: string } | null = {
  id: "user-1",
  username: "Bianca",
  email: "bianca@example.com",
}
const mockFetchProfile = jest.fn()

jest.mock("@/auth/storage", () => ({
  useAuthStore: (selector: any) => selector({ user: mockUser, fetchProfile: mockFetchProfile }),
}))

jest.mock("@/components/profile/ProfileHeroHeader", () => {
  const React = require("react")
  const { Text, Pressable, View } = require("react-native")
  return {
    ProfileHeroHeader: ({ name, email, onSettingsPress, onEditPress }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, name),
        React.createElement(Text, null, email),
        React.createElement(Pressable, { onPress: onSettingsPress }, React.createElement(Text, null, "Settings")),
        React.createElement(Pressable, { onPress: onEditPress }, React.createElement(Text, null, "Edit"))
      ),
  }
})

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

jest.mock("@/components/ui/StatsCard", () => {
  const React = require("react")
  const { Text } = require("react-native")
  return {
    StatCard: ({ label, value }: any) => React.createElement(Text, null, `${label}-${value}`),
  }
})

jest.mock("@/components/ui/MetricCircle", () => {
  const React = require("react")
  const { Text } = require("react-native")
  return {
    MetricCircle: ({ label, value }: any) => React.createElement(Text, null, `${label}-${value}`),
  }
})

describe("profile integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchProfile.mockResolvedValue(undefined)
    mockUser = {
      id: "user-1",
      username: "Bianca",
      email: "bianca@example.com",
    }
  })

  test("shows error popup when profile refresh fails", async () => {
    mockFetchProfile.mockRejectedValueOnce(new Error("fail"))

    const { findByText } = render(<ProfileScreen />)

    expect(await findByText("Profile error")).toBeTruthy()
    expect(await findByText("API error")).toBeTruthy()
  })
})
