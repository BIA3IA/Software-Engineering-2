import { getStatsApi } from "@/api/stats"
import { api } from "@/api/client"

jest.mock("@/api/client", () => ({
    api: {
        get: jest.fn(),
    },
}))

describe("api/stats", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test("getStatsApi fetches stats and returns data", async () => {
        const payload = {
            success: true,
            data: {
                day: {
                    id: "d1",
                    userId: "u1",
                    period: "DAY",
                    avgSpeed: 12.4,
                    avgDuration: 900,
                    avgKilometers: 5.1,
                    totalKilometers: 20.2,
                    totalTime: 3600,
                    longestKilometer: 7.5,
                    longestTime: 1200,
                    pathsCreated: 2,
                    tripCount: 3,
                    updatedAt: "2026-01-30T10:00:00Z",
                },
                week: {
                    id: "w1",
                    userId: "u1",
                    period: "WEEK",
                    avgSpeed: 13,
                    avgDuration: 1200,
                    avgKilometers: 6.3,
                    totalKilometers: 40.5,
                    totalTime: 7200,
                    longestKilometer: 12.1,
                    longestTime: 1800,
                    pathsCreated: 5,
                    tripCount: 6,
                    updatedAt: "2026-01-30T10:00:00Z",
                },
                month: {
                    id: "m1",
                    userId: "u1",
                    period: "MONTH",
                    avgSpeed: 14,
                    avgDuration: 1500,
                    avgKilometers: 7.2,
                    totalKilometers: 80.9,
                    totalTime: 14400,
                    longestKilometer: 20.4,
                    longestTime: 2400,
                    pathsCreated: 10,
                    tripCount: 12,
                    updatedAt: "2026-01-30T10:00:00Z",
                },
                year: {
                    id: "y1",
                    userId: "u1",
                    period: "YEAR",
                    avgSpeed: 15,
                    avgDuration: 1700,
                    avgKilometers: 8.1,
                    totalKilometers: 400.1,
                    totalTime: 72000,
                    longestKilometer: 55.7,
                    longestTime: 3600,
                    pathsCreated: 40,
                    tripCount: 60,
                    updatedAt: "2026-01-30T10:00:00Z",
                },
                overall: {
                    id: "o1",
                    userId: "u1",
                    period: "OVERALL",
                    avgSpeed: 16,
                    avgDuration: 1800,
                    avgKilometers: 9.2,
                    totalKilometers: 1200.4,
                    totalTime: 250000,
                    longestKilometer: 80.1,
                    longestTime: 5400,
                    pathsCreated: 80,
                    tripCount: 120,
                    updatedAt: "2026-01-30T10:00:00Z",
                },
            },
        }

        ;(api.get as jest.Mock).mockResolvedValueOnce({ data: payload })

        const data = await getStatsApi()

        expect(api.get).toHaveBeenCalledWith("/stats")
        expect(data).toEqual(payload.data)
    })
})
