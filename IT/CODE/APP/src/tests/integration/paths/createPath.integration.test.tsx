import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
import CreatePathScreen from "@/app/(main)/create-path"
import { createPathApi, snapPathApi } from "@/api/paths"
import { mockSearchParams, mockRouter } from "@/jest.setup"

jest.mock("@/api/paths", () => ({
    createPathApi: jest.fn(),
    snapPathApi: jest.fn(),
}))

jest.mock("@/utils/apiError", () => ({
    getApiErrorMessage: () => "API error",
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
    useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("expo-location", () => ({
    requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
    getCurrentPositionAsync: jest.fn(async () => ({
        coords: { latitude: 45.0, longitude: 9.0 },
    })),
    watchPositionAsync: jest.fn(async (_options: any, callback: any) => {
        callback?.({ coords: { latitude: 45.0, longitude: 9.0 } })
        callback?.({ coords: { latitude: 45.002, longitude: 9.002 } })
        return { remove: jest.fn() }
    }),
    LocationAccuracy: { Balanced: "balanced" },
}))

jest.mock("react-native-maps", () => {
    const React = require("react")
    const { Pressable, View } = require("react-native")
    const Map = ({ children, onPress }: any) =>
        React.createElement(
            Pressable,
            { onPress, testID: "map" },
            React.createElement(View, null, children)
        )
    return {
        __esModule: true,
        default: Map,
        Marker: View,
        Polyline: View,
        Circle: View,
    }
})

describe("create-path integration", () => {
    beforeEach(() => {
        jest.clearAllMocks()
            ; (createPathApi as jest.Mock).mockReset()
            ; (snapPathApi as jest.Mock).mockReset()
        mockRouter.replace.mockClear()
        mockSearchParams.value = { name: "Test Path", description: "Desc", visibility: "public" }
    })

    test("snaps segment and saves path", async () => {
        ; (snapPathApi as jest.Mock).mockResolvedValueOnce([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
        ])
            ; (createPathApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { getByTestId, getByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(snapPathApi).toHaveBeenCalledWith({
                coordinates: [
                    { lat: 1, lng: 2 },
                    { lat: 3, lng: 4 },
                ],
            })
        })

        await waitFor(() => {
            expect(getByText("Save Path")).toBeTruthy()
        })

        fireEvent.press(getByText(/Save Path|Snapping/))

        await waitFor(() => {
            expect(createPathApi).toHaveBeenCalledWith({
                visibility: true,
                creationMode: "manual",
                title: "Test Path",
                description: "Desc",
                pathSegments: [
                    { start: { lat: 1, lng: 2 }, end: { lat: 3, lng: 4 } },
                ],
            })
        })
    })

    test("success popup navigates to path library", async () => {
        ; (snapPathApi as jest.Mock).mockResolvedValueOnce([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
        ])
            ; (createPathApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { getByTestId, getByText, findByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(snapPathApi).toHaveBeenCalled()
        })

        fireEvent.press(getByText("Save Path"))

        expect(await findByText("Path Creates!")).toBeTruthy()
        fireEvent.press(getByText("Go To Path Library"))

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith("/paths")
        })
    })

    test("snap failure stays silent", async () => {
        ; (snapPathApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { getByTestId, queryByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(snapPathApi).toHaveBeenCalled()
        })

        expect(queryByText("Snapping failed")).toBeNull()
    })

    test("save does nothing with insufficient points", async () => {
        ; (createPathApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { getByTestId, getByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent.press(getByText("Save Path"))

        expect(createPathApi).not.toHaveBeenCalled()
    })

    test("save is blocked while snapping", async () => {
        let resolveSnap: ((value: Array<{ lat: number; lng: number }>) => void) | undefined 
        ;(snapPathApi as jest.Mock).mockImplementation(
            () =>
                new Promise<Array<{ lat: number; lng: number }>>((resolve) => {
                    resolveSnap = resolve
                })
        )

        const { getByTestId, getByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(getByText("Snapping...")).toBeTruthy()
        })

        fireEvent.press(getByText("Snapping..."))

        expect(createPathApi).not.toHaveBeenCalled()

        if (resolveSnap) {
            resolveSnap([{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }])
        }
    })

    test("save error shows popup", async () => {
        ; (snapPathApi as jest.Mock).mockResolvedValueOnce([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
        ])
            ; (createPathApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

        const { getByTestId, findByText, getByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(snapPathApi).toHaveBeenCalled()
        })

        await waitFor(() => {
            expect(getByText("Save Path")).toBeTruthy()
        })

        fireEvent.press(getByText("Save Path"))

        await waitFor(() => {
            expect(createPathApi).toHaveBeenCalled()
        })

        expect(await findByText("Save failed")).toBeTruthy()
        expect(await findByText("API error")).toBeTruthy()
    })

    test("saving state disables subsequent saves", async () => {
        ; (snapPathApi as jest.Mock).mockResolvedValueOnce([
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
        ])
        let resolveSave: ((value: any) => void) | undefined
            ; (createPathApi as jest.Mock).mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        resolveSave = resolve
                    })
            )

        const { getByTestId, getByText } = render(<CreatePathScreen />)

        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 1, longitude: 2 } } })
        fireEvent(getByTestId("map"), "press", { nativeEvent: { coordinate: { latitude: 3, longitude: 4 } } })

        await waitFor(() => {
            expect(snapPathApi).toHaveBeenCalled()
        })

        fireEvent.press(getByText(/Save Path|Snapping/))
        fireEvent.press(getByText(/Save Path|Saving/))

        expect(createPathApi).toHaveBeenCalledTimes(1)

        resolveSave?.(undefined)
    })

    test("discard path confirms and navigates home", async () => {
        const { getByTestId, findByText } = render(<CreatePathScreen />)

        fireEvent.press(getByTestId("create-path-cancel"))

        expect(await findByText("Discard Path?")).toBeTruthy()
        fireEvent.press(await findByText("Yes, Discard"))

        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/home")
        })
    })

    test("automatic mode records gps points and skips snapping", async () => {
        mockSearchParams.value = {
            name: "Auto Path",
            description: "Desc",
            visibility: "public",
            creationMode: "automatic",
        }

        ; (createPathApi as jest.Mock).mockResolvedValueOnce(undefined)

        const { getByText } = render(<CreatePathScreen />)

        await waitFor(() => {
            expect(getByText("Save Path")).toBeTruthy()
        })

        fireEvent.press(getByText(/Save Path/))

        await waitFor(() => {
            expect(snapPathApi).not.toHaveBeenCalled()
            expect(createPathApi).toHaveBeenCalledWith({
                visibility: true,
                creationMode: "automatic",
                title: "Auto Path",
                description: "Desc",
                pathSegments: [
                    { start: { lat: 45.0, lng: 9.0 }, end: { lat: 45.002, lng: 9.002 } },
                ],
            })
        })
    })
})
