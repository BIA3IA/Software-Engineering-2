import { createTripApi, getMyTripsApi, deleteTripApi } from "@/api/trips"
import { api } from "@/api/client"

jest.mock("@/api/client", () => ({
    api: {
        post: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
    },
}))

describe("api/trips", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("createTripApi posts payload", async () => {
        ;(api.post as jest.Mock).mockResolvedValueOnce({ data: { data: { tripId: "t1" } } })

        await createTripApi({
            origin: { lat: 45.0, lng: 9.0 },
            destination: { lat: 45.5, lng: 9.5 },
            startedAt: "2025-01-15T10:00:00Z",
            finishedAt: "2025-01-15T11:00:00Z",
            title: "Morning Ride",
            tripSegments: [
                {
                    segmentId: "seg1",
                    polylineCoordinates: [
                        { lat: 45.0, lng: 9.0 },
                        { lat: 45.5, lng: 9.5 },
                    ],
                },
            ],
        })

        expect(api.post).toHaveBeenCalledWith("/trips", {
            origin: { lat: 45.0, lng: 9.0 },
            destination: { lat: 45.5, lng: 9.5 },
            startedAt: "2025-01-15T10:00:00Z",
            finishedAt: "2025-01-15T11:00:00Z",
            title: "Morning Ride",
            tripSegments: [
                {
                    segmentId: "seg1",
                    polylineCoordinates: [
                        { lat: 45.0, lng: 9.0 },
                        { lat: 45.5, lng: 9.5 },
                    ],
                },
            ],
        })
    })

    test("createTripApi posts payload without optional title", async () => {
        ;(api.post as jest.Mock).mockResolvedValueOnce({ data: { data: { tripId: "t1" } } })

        await createTripApi({
            origin: { lat: 45.0, lng: 9.0 },
            destination: { lat: 45.5, lng: 9.5 },
            startedAt: "2025-01-15T10:00:00Z",
            finishedAt: "2025-01-15T11:00:00Z",
            tripSegments: [],
        })

        expect(api.post).toHaveBeenCalledWith("/trips", {
            origin: { lat: 45.0, lng: 9.0 },
            destination: { lat: 45.5, lng: 9.5 },
            startedAt: "2025-01-15T10:00:00Z",
            finishedAt: "2025-01-15T11:00:00Z",
            tripSegments: [],
        })
    })

    test("getMyTripsApi maps response list", async () => {
        ;(api.get as jest.Mock).mockResolvedValueOnce({
            data: {
                data: {
                    count: 1,
                    trips: [
                        {
                            tripId: "t1",
                            createdAt: "2025-01-15T10:00:00Z",
                            startedAt: "2025-01-15T10:00:00Z",
                            finishedAt: "2025-01-15T11:00:00Z",
                            title: "Morning Ride",
                            origin: { lat: 45.0, lng: 9.0 },
                            destination: { lat: 45.5, lng: 9.5 },
                            statistics: { speed: 25, maxSpeed: 35, distance: 15, time: 60 },
                            weather: null,
                            segmentCount: 1,
                        },
                    ],
                },
            },
        })

        const out = await getMyTripsApi()

        expect(api.get).toHaveBeenCalledWith("/trips", { params: { owner: "me" } })
        expect(out).toHaveLength(1)
        expect(out[0].tripId).toBe("t1")
        expect(out[0].title).toBe("Morning Ride")
        expect(out[0].statistics).toEqual({ speed: 25, maxSpeed: 35, distance: 15, time: 60 })
    })

    test("getMyTripsApi returns empty array when no trips", async () => {
        ;(api.get as jest.Mock).mockResolvedValueOnce({
            data: {
                data: {
                    count: 0,
                    trips: [],
                },
            },
        })

        const out = await getMyTripsApi()

        expect(api.get).toHaveBeenCalledWith("/trips", { params: { owner: "me" } })
        expect(out).toEqual([])
    })

    test("deleteTripApi sends delete request", async () => {
        ;(api.delete as jest.Mock).mockResolvedValueOnce({ data: {} })

        await deleteTripApi("t1")

        expect(api.delete).toHaveBeenCalledWith("/trips/t1")
    })
})
