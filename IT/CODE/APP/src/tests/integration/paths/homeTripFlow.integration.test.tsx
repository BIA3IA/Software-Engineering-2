import React from "react"
import { render, fireEvent, waitFor, act } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { searchPathsApi } from "@/api/paths"
import { createTripApi } from "@/api/trips"
import { attachReportsToTripApi, createReportApi, getReportsByPathApi } from "@/api/reports"

const mockIsNearOrigin = jest.fn()
const mockMinDistanceToRoute = jest.fn()
const mockHaversine = jest.fn()
const mockRequireLogin = jest.fn()

jest.mock("@/api/paths", () => ({
    searchPathsApi: jest.fn(),
}))

jest.mock("@/api/trips", () => ({
    createTripApi: jest.fn(),
}))

jest.mock("@/api/reports", () => ({
    getReportsByPathApi: jest.fn(),
    createReportApi: jest.fn(),
    attachReportsToTripApi: jest.fn(),
}))

let mockCurrentUser: { id: string; username?: string; email?: string } | null = { id: "user-1" }

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
    useLoginPrompt: () => mockRequireLogin,
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/components/paths/SearchResultsSheet", () => {
    const React = require("react")
    const { View, Text, Pressable } = require("react-native")
    return {
        SearchResultsSheet: ({ visible, results, onSelectResult, actionLabel, onActionPress }: any) =>
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
                      ),
                      actionLabel
                          ? React.createElement(
                                Pressable,
                                { onPress: () => onActionPress?.(results[0]) },
                                React.createElement(Text, null, actionLabel)
                            )
                          : null
                  )
                : null,
    }
})

jest.mock("@/components/modals/CreatePathModal", () => ({
    CreatePathModal: () => null,
}))

jest.mock("@/components/modals/ReportIssueModal", () => {
    const React = require("react")
    const { Pressable, Text } = require("react-native")
    return {
        ReportIssueModal: ({ visible, onSubmit }: any) =>
            visible
                ? React.createElement(
                      Pressable,
                      { onPress: () => onSubmit?.({ condition: "MEDIUM", obstacle: "POTHOLE" }) },
                      React.createElement(Text, null, "Submit Report")
                  )
                : null,
    }
})

jest.mock("@/utils/geo", () => ({
    isNearOrigin: (...args: any[]) => mockIsNearOrigin(...args),
    minDistanceToRouteMeters: (...args: any[]) => mockMinDistanceToRoute(...args),
    haversineDistanceMetersLatLng: (...args: any[]) => mockHaversine(...args),
}))

jest.mock("@/utils/map", () => ({
    ...jest.requireActual("@/utils/map"),
    findClosestPointIndex: () => 1,
}))

jest.mock("@/constants/appConfig", () => ({
    ...jest.requireActual("@/constants/appConfig"),
    OFF_ROUTE_MAX_CONSECUTIVE: 1,
    OFF_ROUTE_MAX_MS: 0,
    OFF_ROUTE_DISTANCE_METERS: 5,
    AUTO_COMPLETE_DISTANCE_METERS: 5,
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

describe("home trip flow integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockTripSelection = null
        mockCurrentUser = { id: "user-1" }
        mockLocation = { latitude: 45.0, longitude: 9.0, heading: 0 }
        locationCallback = null
        mockRequireLogin.mockClear()
        mockIsNearOrigin.mockReset()
        mockMinDistanceToRoute.mockReset()
        mockHaversine.mockReset()
        mockIsNearOrigin.mockReturnValue(false)
        mockMinDistanceToRoute.mockReturnValue(0)
        mockHaversine.mockReturnValue(9999)
        ;(getReportsByPathApi as jest.Mock).mockResolvedValue([])
    })

    function emitLocation(lat: number, lng: number) {
        mockLocation = { latitude: lat, longitude: lng, heading: 0 }
        locationCallback?.({ coords: mockLocation })
    }

    test("start trip button appears only when near origin", async () => {
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
                pathSegments: [
                    {
                        segmentId: "seg-1",
                        polylineCoordinates: [
                            { lat: 45.0, lng: 9.0 },
                            { lat: 45.01, lng: 9.01 },
                        ],
                    },
                ],
            },
        ])

        const { getByPlaceholderText, getByText, queryByText, findByText } = render(<HomeScreen />)

        fireEvent.changeText(getByPlaceholderText("Starting point"), "Pavia")
        fireEvent.changeText(getByPlaceholderText("Where to?"), "Milan")
        fireEvent.press(getByText("Find Paths"))

        expect(await findByText("My Path")).toBeTruthy()

        fireEvent.press(getByText("My Path"))

        expect(queryByText("Start Trip")).toBeNull()

        mockIsNearOrigin.mockReturnValue(true)
        emitLocation(45.0, 9.0)

        expect(await findByText("Start Trip")).toBeTruthy()
    })

    test("start trip begins in-trip flow", async () => {
        mockIsNearOrigin.mockReturnValue(true)
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
                pathSegments: [
                    {
                        segmentId: "seg-1",
                        polylineCoordinates: [
                            { lat: 45.0, lng: 9.0 },
                            { lat: 45.01, lng: 9.01 },
                        ],
                    },
                ],
            },
        ])

        const { getByPlaceholderText, getByText, findByText } = render(<HomeScreen />)

        fireEvent.changeText(getByPlaceholderText("Starting point"), "Pavia")
        fireEvent.changeText(getByPlaceholderText("Where to?"), "Milan")
        fireEvent.press(getByText("Find Paths"))

        expect(await findByText("My Path")).toBeTruthy()
        fireEvent.press(getByText("My Path"))

        fireEvent.press(await findByText("Start Trip"))

        expect(await findByText("Complete Trip")).toBeTruthy()
    })

    test("off-route alert shows and continue closes it", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }
        mockMinDistanceToRoute.mockReturnValue(1000)

        const { findByText } = render(<HomeScreen />)

        await findByText("Complete Trip")

        act(() => {
            emitLocation(45.2, 9.2)
        })

        await findByText("Off Route")
        mockMinDistanceToRoute.mockReturnValue(0)
        emitLocation(45.0, 9.0)
        fireEvent.press(await findByText("Continue"))
    })

    test("auto-complete saves trip when reaching destination", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }
        mockHaversine.mockReturnValue(0)
        ;(createTripApi as jest.Mock).mockResolvedValueOnce("trip-1")

        const { findByText } = render(<HomeScreen />)

        await findByText("Complete Trip")
        emitLocation(45.01, 9.01)

        await waitFor(() => {
            expect(createTripApi).toHaveBeenCalled()
        })

        expect(await findByText("Great Ride!")).toBeTruthy()
    })

    test("off-route end trip saves and closes popup", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }
        mockMinDistanceToRoute.mockReturnValue(1000)
        mockHaversine.mockReturnValue(9999)
        ;(createTripApi as jest.Mock).mockResolvedValueOnce("trip-1")

        const { findByText } = render(<HomeScreen />)

        await findByText("Complete Trip")
        emitLocation(45.2, 9.2)

        expect(await findByText("Off Route")).toBeTruthy()
        fireEvent.press(await findByText("End Trip"))

        await waitFor(() => {
            expect(createTripApi).toHaveBeenCalled()
        })
    })

    test("save trip error shows popup", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }
        ;(createTripApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText } = render(<HomeScreen />)

        await findByText("Complete Trip")
        fireEvent.press(await findByText("Complete Trip"))

        expect(await findByText("Trip Error")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("report session attaches to trip on completion", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }
        ;(createReportApi as jest.Mock).mockResolvedValueOnce("r1")
        ;(createTripApi as jest.Mock).mockResolvedValueOnce("trip-1")
        ;(attachReportsToTripApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { findByText, getByTestId, getByText } = render(<HomeScreen />)

        await findByText("Complete Trip")
        fireEvent.press(getByTestId("home-report-issue"))
        fireEvent.press(getByText("Submit Report"))

        emitLocation(45.01, 9.01)
        fireEvent.press(getByText("Complete Trip"))

        await waitFor(() => {
            expect(createTripApi).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(attachReportsToTripApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionId: expect.any(String),
                    tripId: "trip-1",
                })
            )
        })
    })

    test("guest report button triggers login prompt", async () => {
        mockCurrentUser = { id: "guest", username: "Guest", email: "" }
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }

        const { findByText, getByTestId } = render(<HomeScreen />)

        await findByText("Complete Trip")
        fireEvent.press(getByTestId("home-report-issue"))

        expect(mockRequireLogin).toHaveBeenCalled()
    })

    test("cancel trip button opens discard popup", async () => {
        mockTripSelection = {
            id: "p1",
            title: "Path",
            route: [
                { latitude: 45.0, longitude: 9.0 },
                { latitude: 45.01, longitude: 9.01 },
            ],
            pathSegments: [
                {
                    segmentId: "seg-1",
                    polylineCoordinates: [
                        { latitude: 45.0, longitude: 9.0 },
                        { latitude: 45.01, longitude: 9.01 },
                    ],
                },
            ],
        }

        const { findByText, getByTestId } = render(<HomeScreen />)

        await findByText("Complete Trip")
        fireEvent.press(getByTestId("home-cancel-trip"))

        expect(await findByText("End Trip?")).toBeTruthy()
    })
})
