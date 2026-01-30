import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import TripHistoryScreen from "@/app/(main)/trips"
import { getMyTripsApi, deleteTripApi } from "@/api/trips"

jest.mock("@/api/trips", () => ({
    getMyTripsApi: jest.fn(),
    deleteTripApi: jest.fn(),
}))

jest.mock("@/utils/apiError", () => ({
    getApiErrorMessage: () => "API error",
}))

jest.mock("@/utils/date", () => ({
    formatDate: (date: string) => {
        const d = new Date(date)
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() - 2000}`
    },
}))

jest.mock("@/utils/routes", () => ({
    buildRouteFromPathPointSegments: () => [],
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/components/route/RouteCard", () => {
    const React = require("react")
    const { View, Text, Pressable } = require("react-native")
    return {
        RouteCard: ({ trip, onDeletePress }: any) =>
            React.createElement(
                View,
                null,
                React.createElement(Text, null, trip.name),
                React.createElement(
                    Pressable,
                    { onPress: onDeletePress },
                    React.createElement(Text, null, `Delete ${trip.id}`)
                )
            ),
    }
})

jest.mock("@/components/ui/ScreenHeader", () => {
    const React = require("react")
    const { Text, Pressable } = require("react-native")
    return {
        ScreenHeader: ({ onSortPress }: any) =>
            React.createElement(
                React.Fragment,
                null,
                React.createElement(Text, null, "Trip History"),
                React.createElement(
                    Pressable,
                    { onPress: onSortPress },
                    React.createElement(Text, null, "Sort")
                )
            ),
    }
})

jest.mock("@/components/ui/SelectionOverlay", () => {
    const React = require("react")
    const { Pressable, Text } = require("react-native")
    return {
        SelectionOverlay: ({ visible, options, onSelect }: any) =>
            visible
                ? React.createElement(
                      React.Fragment,
                      null,
                      options.map((opt: any) =>
                          React.createElement(
                              Pressable,
                              { key: opt.key, onPress: () => onSelect(opt.key) },
                              React.createElement(Text, null, opt.key)
                          )
                      )
                  )
                : null,
    }
})

const createMockTrip = (overrides: Partial<any> = {}) => ({
    tripId: "t1",
    createdAt: "2025-01-15T10:00:00Z",
    startedAt: "2025-01-15T10:00:00Z",
    finishedAt: "2025-01-15T11:00:00Z",
    title: "Morning Ride",
    origin: { lat: 45.0, lng: 9.0 },
    destination: { lat: 45.5, lng: 9.5 },
    stats: { avgSpeed: 25, kilometers: 15, duration: 60 },
    weather: null,
    segmentCount: 1,
    tripSegments: [],
    ...overrides,
})

describe("trips integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("loads and renders trips on focus", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([createMockTrip()])

        const { findByText } = render(<TripHistoryScreen />)

        expect(await findByText("Morning Ride")).toBeTruthy()
        expect(getMyTripsApi).toHaveBeenCalled()
    })

    test("shows empty message when no trips", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([])

        const { findByText } = render(<TripHistoryScreen />)

        expect(await findByText(/Your Trip History is empty/)).toBeTruthy()
    })

    test("delete flow calls api", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValueOnce([createMockTrip()])
        ;(deleteTripApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { findByText, getByText } = render(<TripHistoryScreen />)

        await findByText("Morning Ride")
        fireEvent.press(getByText("Delete t1"))
        fireEvent.press(getByText("Yes, Delete"))

        await waitFor(() => {
            expect(deleteTripApi).toHaveBeenCalledWith("t1")
        })
    })

    test("delete error shows popup", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([createMockTrip()])
        ;(deleteTripApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText, getByText } = render(<TripHistoryScreen />)

        await findByText("Morning Ride")
        fireEvent.press(getByText("Delete t1"))
        fireEvent.press(getByText("Yes, Delete"))

        expect(await findByText("Delete failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("cancel delete closes popup", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([createMockTrip()])

        const { findByText, getByText, queryByText } = render(<TripHistoryScreen />)

        await findByText("Morning Ride")
        fireEvent.press(getByText("Delete t1"))
        fireEvent.press(getByText("No, Cancel"))

        await waitFor(() => {
            expect(queryByText("Yes, Delete")).toBeNull()
        })
        expect(deleteTripApi).not.toHaveBeenCalled()
    })

    test("loading error shows popup", async () => {
        ;(getMyTripsApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText } = render(<TripHistoryScreen />)

        expect(await findByText("Loading failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("sorts alphabetically when selected", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([
            createMockTrip({ tripId: "t1", title: "Zulu Ride", startedAt: "2025-01-15T10:00:00Z" }),
            createMockTrip({ tripId: "t2", title: "Alpha Ride", startedAt: "2025-01-16T10:00:00Z" }),
        ])

        const { findByText, getByText, getAllByText } = render(<TripHistoryScreen />)

        await findByText("Zulu Ride")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("alphabetical"))

        const names = getAllByText(/Zulu Ride|Alpha Ride/).map((node) => node.props.children)
        expect(names[0]).toBe("Alpha Ride")
    })

    test("sorts by date when selected", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([
            createMockTrip({ tripId: "t1", title: "Older", startedAt: "2025-01-10T10:00:00Z" }),
            createMockTrip({ tripId: "t2", title: "Newer", startedAt: "2025-01-15T10:00:00Z" }),
        ])

        const { findByText, getByText, getAllByText } = render(<TripHistoryScreen />)

        await findByText("Older")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("date"))

        const names = getAllByText(/Older|Newer/).map((node) => node.props.children)
        expect(names[0]).toBe("Newer")
    })

    test("sorts by distance when selected", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([
            createMockTrip({
                tripId: "t1",
                title: "Short",
                stats: { avgSpeed: 25, kilometers: 5, duration: 30 },
            }),
            createMockTrip({
                tripId: "t2",
                title: "Long",
                stats: { avgSpeed: 25, kilometers: 50, duration: 120 },
            }),
        ])

        const { findByText, getByText, getAllByText } = render(<TripHistoryScreen />)

        await findByText("Short")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("distance"))

        const names = getAllByText(/Short|Long/).map((node) => node.props.children)
        expect(names[0]).toBe("Long")
    })

    test("sorts by duration when selected", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([
            createMockTrip({
                tripId: "t1",
                title: "Quick",
                stats: { avgSpeed: 25, kilometers: 10, duration: 20 },
            }),
            createMockTrip({
                tripId: "t2",
                title: "Slow",
                stats: { avgSpeed: 25, kilometers: 10, duration: 120 },
            }),
        ])

        const { findByText, getByText, getAllByText } = render(<TripHistoryScreen />)

        await findByText("Quick")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("duration"))

        const names = getAllByText(/Quick|Slow/).map((node) => node.props.children)
        expect(names[0]).toBe("Slow")
    })

    test("displays trip without title as 'Trip'", async () => {
        ;(getMyTripsApi as jest.Mock).mockResolvedValue([
            createMockTrip({ tripId: "t1", title: null }),
        ])

        const { findByText } = render(<TripHistoryScreen />)

        expect(await findByText("Trip")).toBeTruthy()
    })
})
