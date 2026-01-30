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
const mockGetStats = jest.fn()

jest.mock("@/auth/storage", () => ({
  useAuthStore: (selector: any) => selector({ user: mockUser, fetchProfile: mockFetchProfile }),
}))

jest.mock("@/api/stats", () => ({
  getStatsApi: () => mockGetStats(),
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
    SelectionOverlay: ({ options, onSelect }: any) =>
      React.createElement(
        View,
        null,
        options.map((opt: any) =>
          React.createElement(
            Pressable,
            { key: opt.key, onPress: () => onSelect(opt.key) },
            React.createElement(Text, null, opt.label)
          )
        )
      ),
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
    mockGetStats.mockResolvedValue({
      day: {
        id: "day",
        userId: "user-1",
        period: "DAY",
        avgSpeed: 18.5,
        avgDuration: 1800,
        avgKilometers: 9.1,
        totalKilometers: 9.1,
        totalTime: 1800,
        longestKilometer: 9.1,
        longestTime: 1800,
        pathsCreated: 1,
        tripCount: 1,
        updatedAt: "2026-01-30T10:00:00.000Z",
      },
      week: {
        id: "week",
        userId: "user-1",
        period: "WEEK",
        avgSpeed: 19.1,
        avgDuration: 2100,
        avgKilometers: 10.5,
        totalKilometers: 63,
        totalTime: 12600,
        longestKilometer: 20,
        longestTime: 3600,
        pathsCreated: 3,
        tripCount: 6,
        updatedAt: "2026-01-30T10:00:00.000Z",
      },
      month: {
        id: "month",
        userId: "user-1",
        period: "MONTH",
        avgSpeed: 19.0,
        avgDuration: 2400,
        avgKilometers: 12.2,
        totalKilometers: 244,
        totalTime: 48000,
        longestKilometer: 32.5,
        longestTime: 5400,
        pathsCreated: 7,
        tripCount: 20,
        updatedAt: "2026-01-30T10:00:00.000Z",
      },
      year: {
        id: "year",
        userId: "user-1",
        period: "YEAR",
        avgSpeed: 19.4,
        avgDuration: 2600,
        avgKilometers: 13.4,
        totalKilometers: 804,
        totalTime: 156000,
        longestKilometer: 48.3,
        longestTime: 7200,
        pathsCreated: 22,
        tripCount: 60,
        updatedAt: "2026-01-30T10:00:00.000Z",
      },
      overall: {
        id: "overall",
        userId: "user-1",
        period: "OVERALL",
        avgSpeed: 19.4,
        avgDuration: 2400,
        avgKilometers: 13.9,
        totalKilometers: 1204.8,
        totalTime: 208000,
        longestKilometer: 78.4,
        longestTime: 9100,
        pathsCreated: 40,
        tripCount: 86,
        updatedAt: "2026-01-30T10:00:00.000Z",
      },
    })
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

  test("shows error popup when stats refresh fails", async () => {
    mockGetStats.mockRejectedValueOnce(new Error("fail"))

    const { findByText } = render(<ProfileScreen />)

    expect(await findByText("Statistics error")).toBeTruthy()
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

  test("loads stats and renders overall cards", async () => {
    const { findByText } = render(<ProfileScreen />)

    expect(await findByText("Distance-1204.8 km")).toBeTruthy()
    expect(await findByText("Trips-86")).toBeTruthy()
    expect(await findByText("Paths-40")).toBeTruthy()
  })

  test("renders month activity stats by default", async () => {
    const { findByText } = render(<ProfileScreen />)

    expect(await findByText("Total Distance-244.0 km")).toBeTruthy()
    expect(await findByText("Total Time-13h 20m")).toBeTruthy()
    expect(await findByText("Avg Speed-19.0 km/h")).toBeTruthy()
  })

  test("switches activity period and updates metrics", async () => {
    const { findByText, getByTestId } = render(<ProfileScreen />)

    fireEvent.press(getByTestId("profile-period-selector"))

    const weekButton = await findByText("Week")
    fireEvent.press(weekButton)

    expect(await findByText("Total Distance-63.0 km")).toBeTruthy()
    expect(await findByText("Trips-6")).toBeTruthy()
    expect(await findByText("Avg Speed-19.1 km/h")).toBeTruthy()
  })

  test("renders zeros when stats payload is empty", async () => {
    mockGetStats.mockResolvedValueOnce({
      day: { userId: "user-1", period: "DAY", avgSpeed: 0, avgDuration: 0, avgKilometers: 0, totalKilometers: 0, totalTime: 0, longestKilometer: 0, longestTime: 0, pathsCreated: 0, tripCount: 0, updatedAt: "2026-01-30T10:00:00.000Z" },
      week: { userId: "user-1", period: "WEEK", avgSpeed: 0, avgDuration: 0, avgKilometers: 0, totalKilometers: 0, totalTime: 0, longestKilometer: 0, longestTime: 0, pathsCreated: 0, tripCount: 0, updatedAt: "2026-01-30T10:00:00.000Z" },
      month: { userId: "user-1", period: "MONTH", avgSpeed: 0, avgDuration: 0, avgKilometers: 0, totalKilometers: 0, totalTime: 0, longestKilometer: 0, longestTime: 0, pathsCreated: 0, tripCount: 0, updatedAt: "2026-01-30T10:00:00.000Z" },
      year: { userId: "user-1", period: "YEAR", avgSpeed: 0, avgDuration: 0, avgKilometers: 0, totalKilometers: 0, totalTime: 0, longestKilometer: 0, longestTime: 0, pathsCreated: 0, tripCount: 0, updatedAt: "2026-01-30T10:00:00.000Z" },
      overall: { userId: "user-1", period: "OVERALL", avgSpeed: 0, avgDuration: 0, avgKilometers: 0, totalKilometers: 0, totalTime: 0, longestKilometer: 0, longestTime: 0, pathsCreated: 0, tripCount: 0, updatedAt: "2026-01-30T10:00:00.000Z" },
    })

    const { findByText, findAllByText } = render(<ProfileScreen />)

    expect(await findByText("Distance-0 km")).toBeTruthy()
    const trips = await findAllByText("Trips-0")
    expect(trips.length).toBeGreaterThan(0)
    const paths = await findAllByText("Paths-0")
    expect(paths.length).toBeGreaterThan(0)
  })

  test("does not refresh profile for guest", async () => {
    mockUser = { id: "guest", username: "Guest", email: "" }

    render(<ProfileScreen />)

    await waitFor(() => {
      expect(mockFetchProfile).not.toHaveBeenCalled()
    })
  })
})
