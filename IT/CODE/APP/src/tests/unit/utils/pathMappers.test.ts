import Colors from "@/constants/Colors"
import { mapUserPathSummaryToSearchResult, mapUserPathSummaryToRouteItem } from "@/utils/pathMappers"

jest.mock("@/utils/tags", () => ({
    buildStatusTag: () => ({
        label: "Optimal",
        color: "green",
        textColor: "white",
    }),
}))

jest.mock("@/utils/routes", () => ({
    buildRouteFromLatLngSegments: jest.fn(() => [{ latitude: 1, longitude: 2 }]),
    buildRouteFromPathPointSegments: jest.fn(() => []),
}))

describe("path mappers", () => {
    test("search result uses fallback title/description", () => {
        const summary: any = {
            pathId: "p1",
            title: "",
            description: "   ",
            status: "OPTIMAL",
            distanceKm: 12,
            origin: { lat: 1, lng: 2 },
            destination: { lat: 3, lng: 4 },
            createdAt: "2025-01-01T10:00:00Z",
            segmentCount: 0,
        }

        const result = mapUserPathSummaryToSearchResult(summary, Colors.light)

        expect(result.title).toBe("Untitled Path")
        expect(result.description).toBe("No description available.")
    })

    test("search result prepends distance tag and status tag", () => {
        const summary: any = {
            pathId: "p1",
            title: "Path",
            description: "desc",
            status: "OPTIMAL",
            distanceKm: 12,
            origin: { lat: 1, lng: 2 },
            destination: { lat: 3, lng: 4 },
            createdAt: "2025-01-01T10:00:00Z",
            segmentCount: 0,
        }

        const result = mapUserPathSummaryToSearchResult(summary, Colors.light)

        expect(result.tags[0]?.label).toMatch(/12\.0 km/)
        expect(result.tags[1]?.label).toBe("Optimal")
    })

    test("route item falls back to origin/destination when segments missing", () => {
        const summary: any = {
            pathId: "p1",
            title: "Path",
            description: "desc",
            status: "OPTIMAL",
            distanceKm: 12,
            visibility: true,
            origin: { lat: 1, lng: 2 },
            destination: { lat: 3, lng: 4 },
            createdAt: "2025-01-01T10:00:00Z",
            segmentCount: 0,
        }

        const result = mapUserPathSummaryToRouteItem(summary)

        expect(result.route).toEqual([
            { latitude: 1, longitude: 2 },
            { latitude: 3, longitude: 4 },
        ])
    })
})
