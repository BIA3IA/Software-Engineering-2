import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { searchPathsApi } from "@/api/paths"
import { createTripApi } from "@/api/trips"

jest.mock("@/api/paths", () => ({
    searchPathsApi: jest.fn(),
}))

jest.mock("@/api/trips", () => ({
    createTripApi: jest.fn(),
}))

let mockCurrentUser = { id: "user-1" }

jest.mock("@/auth/storage", () => ({
    useAuthStore: (selector: any) => selector({ user: mockCurrentUser }),
}))

let mockTripSelection: any = null
const mockSetTripLaunchSelection = jest.fn((value) => {
    mockTripSelection = value
})

jest.mock("@/hooks/useTripLaunchSelection", () => ({
    useTripLaunchSelection: () => mockTripSelection,
    useSetTripLaunchSelection: () => mockSetTripLaunchSelection,
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
        mockTripSelection = null
        mockCurrentUser = { id: "user-1" }
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

    test("complete trip saves and shows success popup", async () => {
        mockTripSelection = {
            id: "path-1",
            title: "Morning Loop",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.001, longitude: 9.001 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.001, longitude: 9.001 },
                    ],
                },
            ],
        }
        ; (createTripApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { getByText, findByText } = render(<HomeScreen />)

        fireEvent.press(getByText("Complete Trip"))

        await waitFor(() => {
            expect(createTripApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    origin: { lat: 45.0, lng: 9.0 },
                    destination: { lat: 45.001, lng: 9.001 },
                    title: "Morning Loop",
                })
            )
        })

        expect(await findByText("Great Ride!")).toBeTruthy()
        expect(await findByText(/trip has been saved/i)).toBeTruthy()
    })

    test("complete trip shows error when segments are missing", async () => {
        mockTripSelection = {
            id: "path-2",
            title: "Broken Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.002, longitude: 9.002 },
            ],
            pathSegments: [],
        }

        const { getByText, findByText } = render(<HomeScreen />)

        fireEvent.press(getByText("Complete Trip"))

        expect(await findByText("Trip Error")).toBeTruthy()
        expect(await findByText("Trip segments are incomplete. Please try again.")).toBeTruthy()
        expect(createTripApi).not.toHaveBeenCalled()
    })

    test("complete trip error shows popup when api fails", async () => {
        mockTripSelection = {
            id: "path-3",
            title: "City Ride",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.003, longitude: 9.003 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-2",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.003, longitude: 9.003 },
                    ],
                },
            ],
        }
        ; (createTripApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { getByText, findByText } = render(<HomeScreen />)

        fireEvent.press(getByText("Complete Trip"))

        expect(await findByText("Trip Error")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })
})
