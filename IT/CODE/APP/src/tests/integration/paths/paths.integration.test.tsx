import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import PathsScreen from "@/app/(main)/paths"
import { getMyPathsApi, deletePathApi, changePathVisibilityApi } from "@/api/paths"
import { mockRouter } from "@/jest.setup"

jest.mock("@/api/paths", () => ({
    getMyPathsApi: jest.fn(),
    deletePathApi: jest.fn(),
    changePathVisibilityApi: jest.fn(),
}))

jest.mock("@/utils/apiError", () => ({
    getApiErrorMessage: () => "API error",
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/components/route/RouteCard", () => {
    const React = require("react")
    const { View, Text, Pressable } = require("react-native")
    return {
        RouteCard: ({ trip, onDeletePress, onVisibilityPress }: any) =>
            React.createElement(
                View,
                null,
                React.createElement(Text, null, trip.name),
                React.createElement(
                    Pressable,
                    { onPress: onDeletePress },
                    React.createElement(Text, null, `Delete ${trip.id}`)
                ),
                React.createElement(
                    Pressable,
                    { onPress: onVisibilityPress },
                    React.createElement(Text, null, `Visibility ${trip.id}`)
                ),
                trip.actionLabel
                    ? React.createElement(
                          Pressable,
                          { onPress: trip.onActionPress },
                          React.createElement(Text, null, trip.actionLabel)
                      )
                    : null
            ),
    }
})

jest.mock("@/components/ui/ScreenHeader", () => {
    const React = require("react")
    const { Text, Pressable } = require("react-native")
    return {
        ScreenHeader: ({ title, onSortPress }: any) =>
            React.createElement(
                React.Fragment,
                null,
                React.createElement(Text, null, title),
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

const mockSetTripLaunchSelection = jest.fn()

jest.mock("@/hooks/useTripLaunchSelection", () => ({
    useSetTripLaunchSelection: () => mockSetTripLaunchSelection,
}))

jest.mock("@/utils/geo", () => ({
    isNearOrigin: () => true,
}))

describe("paths integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("loads and renders paths on focus", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])

        const { findByText } = render(<PathsScreen />)

        expect(await findByText("My Path")).toBeTruthy()
        expect(getMyPathsApi).toHaveBeenCalled()
    })

    test("delete flow calls api", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValueOnce([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])
            ; (deletePathApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { findByText, getByText } = render(<PathsScreen />)

        await findByText("My Path")
        fireEvent.press(getByText("Delete p1"))
        fireEvent.press(getByText("Yes, Delete"))

        await waitFor(() => {
            expect(deletePathApi).toHaveBeenCalledWith("p1")
        })

    })

    test("start trip sets selection and navigates home", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValueOnce([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])

        const { findByText, getByText } = render(<PathsScreen />)

        await findByText("My Path")
        fireEvent.press(getByText("Start Trip"))

        expect(mockSetTripLaunchSelection).toHaveBeenCalled()
        expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/home")
    })

    test("visibility change calls api", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])
            ; (changePathVisibilityApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { findByText, getByText } = render(<PathsScreen />)

        await findByText("My Path")
        fireEvent.press(getByText("Visibility p1"))
        fireEvent.press(getByText("Yes, Change"))

        await waitFor(() => {
            expect(changePathVisibilityApi).toHaveBeenCalledWith("p1", false)
        })
    })

    test("delete error shows popup", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])
            ; (deletePathApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText, getByText } = render(<PathsScreen />)

        await findByText("My Path")
        fireEvent.press(getByText("Delete p1"))
        fireEvent.press(getByText("Yes, Delete"))

        expect(await findByText("Delete failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("visibility error shows popup", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "My Path",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: new Date().toISOString(),
                segmentCount: 2,
            },
        ])
            ; (changePathVisibilityApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText, getByText } = render(<PathsScreen />)

        await findByText("My Path")
        fireEvent.press(getByText("Visibility p1"))
        fireEvent.press(getByText("Yes, Change"))

        expect(await findByText("Visibility update failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("shows empty message when no paths", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValueOnce([])

        const { findByText } = render(<PathsScreen />)

        expect(await findByText(/Your path library is empty/)).toBeTruthy()
    })

    test("loading error shows popup", async () => {
        ; (getMyPathsApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { findByText } = render(<PathsScreen />)

        expect(await findByText("Loading failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("sorts alphabetically when selected", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "Zed",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-01T10:00:00Z",
                segmentCount: 2,
            },
            {
                pathId: "p2",
                title: "Alpha",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-02T10:00:00Z",
                segmentCount: 2,
            },
        ])

        const { findByText, getByText, getAllByText } = render(<PathsScreen />)

        await findByText("Zed")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("alphabetical"))

        const names = getAllByText(/Zed|Alpha/).map((node) => node.props.children)
        expect(names[0]).toBe("Alpha")
    })

    test("sorts by date when selected", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "Older",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-01T10:00:00Z",
                segmentCount: 2,
            },
            {
                pathId: "p2",
                title: "Newer",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-02T10:00:00Z",
                segmentCount: 2,
            },
        ])

        const { findByText, getByText, getAllByText } = render(<PathsScreen />)

        await findByText("Older")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("date"))

        const names = getAllByText(/Older|Newer/).map((node) => node.props.children)
        expect(names[0]).toBe("Newer")
    })

    test("sorts by distance when selected", async () => {
        ; (getMyPathsApi as jest.Mock).mockResolvedValue([
            {
                pathId: "p1",
                title: "Short",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                distanceKm: 2,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-01T10:00:00Z",
                segmentCount: 2,
            },
            {
                pathId: "p2",
                title: "Long",
                description: "desc",
                status: "OPTIMAL",
                score: 5,
                distanceKm: 12,
                visibility: true,
                origin: { lat: 1, lng: 2 },
                destination: { lat: 3, lng: 4 },
                createdAt: "2025-01-02T10:00:00Z",
                segmentCount: 2,
            },
        ])

        const { findByText, getByText, getAllByText } = render(<PathsScreen />)

        await findByText("Short")
        fireEvent.press(getByText("Sort"))
        fireEvent.press(getByText("distance"))

        const names = getAllByText(/Short|Long/).map((node) => node.props.children)
        expect(names[0]).toBe("Long")
    })
})
