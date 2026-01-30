import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { searchPathsApi } from "@/api/paths"
import { createTripApi } from "@/api/trips"
import { getReportsByPathApi } from "@/api/reports"
import * as Location from "expo-location"

jest.mock("@/api/paths", () => ({
    searchPathsApi: jest.fn(),
}))

jest.mock("@/api/trips", () => ({
    createTripApi: jest.fn(),
}))

jest.mock("@/api/reports", () => ({
    getReportsByPathApi: jest.fn(),
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

jest.mock("@/constants/appConfig", () => ({
    ...jest.requireActual("@/constants/appConfig"),
    AUTO_COMPLETE_DISTANCE_METERS: 0,
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

let mockLocation = { latitude: 45.0, longitude: 9.0, heading: 0 }
let locationCallback: any = null

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    getCurrentPositionAsync: jest.fn(async () => ({
        coords: mockLocation,
    })),
    watchPositionAsync: jest.fn(async (_options: any, callback: any) => {
        locationCallback = callback
        callback?.({ coords: mockLocation })
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

describe("home paths integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockTripSelection = null
        mockCurrentUser = { id: "user-1" }
        mockLocation = { latitude: 45.0, longitude: 9.0, heading: 0 }
        locationCallback = null
        ;(getReportsByPathApi as jest.Mock).mockResolvedValue([])
    })

    function emitLocation(lat: number, lng: number) {
        mockLocation = { latitude: lat, longitude: lng, heading: 0 }
        locationCallback?.({ coords: mockLocation })
    }

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
                { latitude: 45.002, longitude: 9.002 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.001, longitude: 9.001 },
                        { latitude: 45.002, longitude: 9.002 },
                    ],
                },
            ],
        }
        mockLocation = { latitude: 45.001, longitude: 9.001, heading: 0 }
        ; (createTripApi as jest.Mock).mockResolvedValueOnce("trip-1")

        const { getByText, findByText } = render(<HomeScreen />)

        await waitFor(() => {
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled()
        })
        emitLocation(45.001, 9.001)

        fireEvent.press(getByText("Complete Trip"))

        await waitFor(() => {
            expect(createTripApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    origin: { lat: 45.0, lng: 9.0 },
                    destination: { lat: 45.002, lng: 9.002 },
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
                { latitude: 45.001, longitude: 9.001 },
                { latitude: 45.002, longitude: 9.002 },
            ],
            pathSegments: [],
        }
        mockLocation = { latitude: 45.001, longitude: 9.001, heading: 0 }

        const { getByText, findByText } = render(<HomeScreen />)

        await waitFor(() => {
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled()
        })
        emitLocation(45.001, 9.001)

        fireEvent.press(getByText("Complete Trip"))

        expect(await findByText("Trip Error")).toBeTruthy()
        expect(await findByText("Trip too short to be saved. Please ride a bit longer and try again.")).toBeTruthy()
        expect(createTripApi).not.toHaveBeenCalled()
    })

    test("complete trip error shows popup when api fails", async () => {
        mockTripSelection = {
            id: "path-3",
            title: "City Ride",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.0015, longitude: 9.0015 },
                { latitude: 45.003, longitude: 9.003 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-2",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.0015, longitude: 9.0015 },
                        { latitude: 45.003, longitude: 9.003 },
                    ],
                },
            ],
        }
        mockLocation = { latitude: 45.0015, longitude: 9.0015, heading: 0 }
        ; (createTripApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { getByText, findByText } = render(<HomeScreen />)

        await waitFor(() => {
            expect(Location.getCurrentPositionAsync).toHaveBeenCalled()
        })
        emitLocation(45.0015, 9.0015)

        fireEvent.press(getByText("Complete Trip"))

        expect(await findByText("Trip Error")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

})
