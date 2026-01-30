import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import ProfileScreen from "@/app/(main)/profile"
import { mockRouter } from "@/jest.setup"

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
        React.createElement(
          Pressable,
          { onPress: onSettingsPress, testID: "profile-settings" },
          React.createElement(Text, null, "Settings")
        ),
        React.createElement(
          Pressable,
          { onPress: onEditPress, testID: "profile-edit" },
          React.createElement(Text, null, "Edit")
        )
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
    mockRouter.push.mockClear()
    mockRouter.replace.mockClear()
    mockRouter.back.mockClear()
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

  test("renders user name and email", async () => {
    const { findByText } = render(<ProfileScreen />)

    expect(await findByText("Bianca")).toBeTruthy()
    expect(await findByText("bianca@example.com")).toBeTruthy()
  })

  test("settings and edit buttons navigate to correct routes", async () => {
    const { getByTestId } = render(<ProfileScreen />)

    fireEvent.press(getByTestId("profile-settings"))
    fireEvent.press(getByTestId("profile-edit"))

    expect(mockRouter.push).toHaveBeenCalledWith("/settings")
    expect(mockRouter.push).toHaveBeenCalledWith("/edit-profile")
  })

  test("refreshes profile when user is logged in", async () => {
    render(<ProfileScreen />)

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalled()
    })
  })

  test("does not refresh profile for guest", async () => {
    mockUser = { id: "guest", username: "Guest", email: "" }

    render(<ProfileScreen />)

    await waitFor(() => {
      expect(mockFetchProfile).not.toHaveBeenCalled()
    })
  })
})
