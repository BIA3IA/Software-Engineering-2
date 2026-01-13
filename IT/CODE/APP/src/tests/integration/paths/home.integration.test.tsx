import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { searchPathsApi } from "@/api/paths"

jest.mock("@/api/paths", () => ({
    searchPathsApi: jest.fn(),
}))

jest.mock("@/auth/storage", () => ({
    useAuthStore: (selector: any) => selector({ user: { id: "user-1" } }),
}))

jest.mock("@/hooks/useLoginPrompt", () => ({
    useLoginPrompt: () => jest.fn(),
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/components/paths/SearchResultsSheet", () => ({
    SearchResultsSheet: () => null,
}))

jest.mock("@/components/modals/CreatePathModal", () => ({
    CreatePathModal: () => null,
}))

jest.mock("@/components/modals/ReportIssueModal", () => ({
    ReportIssueModal: () => null,
}))

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    getCurrentPositionAsync: jest.fn(async () => ({
        coords: { latitude: 45.0, longitude: 9.0, heading: 0 },
    })),
    watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
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

describe("home paths integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("search does not fire without origin or destination", () => {
        const { getByText } = render(<HomeScreen />)

        fireEvent.press(getByText("Find Paths"))

        expect(searchPathsApi).not.toHaveBeenCalled()
    })

    test("search calls api with origin and destination", async () => {
        ; (searchPathsApi as jest.Mock).mockResolvedValueOnce([])

        const { getByPlaceholderText, getByText } = render(<HomeScreen />)

        fireEvent.changeText(getByPlaceholderText("Starting point"), "Pavia")
        fireEvent.changeText(getByPlaceholderText("Where to?"), "Milan")
        fireEvent.press(getByText("Find Paths"))

        await waitFor(() => {
            expect(searchPathsApi).toHaveBeenCalledWith({ origin: "Pavia", destination: "Milan" })
        })
    })

    test("search error shows popup", async () => {
        ; (searchPathsApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { getByPlaceholderText, getByText, findByText } = render(<HomeScreen />)

        fireEvent.changeText(getByPlaceholderText("Starting point"), "Pavia")
        fireEvent.changeText(getByPlaceholderText("Where to?"), "Milan")
        fireEvent.press(getByText("Find Paths"))

        expect(await findByText("Search Error")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })
})
