import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { searchPathsApi } from "@/api/paths"
import { getReportsByPathApi } from "@/api/reports"

jest.mock("@/api/paths", () => ({
    searchPathsApi: jest.fn(),
}))

jest.mock("@/api/reports", () => ({
    getReportsByPathApi: jest.fn(),
}))

jest.mock("@/api/trips", () => ({
    createTripApi: jest.fn(),
}))

let mockCurrentUser = { id: "user-1" }

jest.mock("@/auth/storage", () => ({
    useAuthStore: (selector: any) => selector({ user: mockCurrentUser }),
}))

jest.mock("@/hooks/useTripLaunchSelection", () => ({
    useTripLaunchSelection: () => null,
    useSetTripLaunchSelection: () => jest.fn(),
}))

jest.mock("@/hooks/useLoginPrompt", () => ({
    useLoginPrompt: () => jest.fn(),
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/components/paths/SearchResultsSheet", () => {
    const React = require("react")
    const { View, Text, Pressable } = require("react-native")
    return {
        SearchResultsSheet: ({ visible, results, onSelectResult }: any) =>
            visible
                ? React.createElement(
                      View,
                      null,
                      results.map((result: any) =>
                          React.createElement(
                              Pressable,
                              { key: result.id, onPress: () => onSelectResult?.(result) },
                              React.createElement(Text, null, result.title)
                          )
                      )
                  )
                : null,
    }
})

jest.mock("@/components/modals/CreatePathModal", () => ({
    CreatePathModal: () => null,
}))

jest.mock("@/components/modals/ReportIssueModal", () => ({
    ReportIssueModal: () => null,
}))

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    getCurrentPositionAsync: jest.fn(async () => ({
        coords: { latitude: 45.0, longitude: 9.0 },
    })),
    watchPositionAsync: jest.fn(async (_options: any, callback: any) => {
        callback?.({ coords: { latitude: 45.0, longitude: 9.0 } })
        return { remove: jest.fn() }
    }),
    reverseGeocodeAsync: jest.fn(async () => []),
    LocationAccuracy: { Balanced: "balanced" },
}))

jest.mock("react-native-maps", () => {
    const React = require("react")
    const { View } = require("react-native")
    const Map = ({ children }: any) => React.createElement(View, null, children)
    return {
        __esModule: true,
        default: Map,
        Marker: View,
        Polyline: View,
        Circle: View,
    }
})

describe("home search results integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockCurrentUser = { id: "user-1" }
        ;(getReportsByPathApi as jest.Mock).mockResolvedValue([])
    })

    test("search results render and selection loads reports", async () => {
        ;(searchPathsApi as jest.Mock).mockResolvedValueOnce([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                distanceKm: 3.2,
                visibility: true,
                origin: { lat: 45.0, lng: 9.0 },
                destination: { lat: 45.1, lng: 9.1 },
                createdAt: new Date().toISOString(),
                segmentCount: 1,
            },
        ])

        const { getByPlaceholderText, getByText, findByText } = render(<HomeScreen />)

        fireEvent.changeText(getByPlaceholderText("Starting point"), "Pavia")
        fireEvent.changeText(getByPlaceholderText("Where to?"), "Milan")
        fireEvent.press(getByText("Find Paths"))

        expect(await findByText("My Path")).toBeTruthy()

        fireEvent.press(getByText("My Path"))

        await waitFor(() => {
            expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
        })
    })
})
