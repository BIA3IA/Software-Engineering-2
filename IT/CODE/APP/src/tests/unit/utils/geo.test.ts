import {
    haversineDistanceMeters,
    haversineDistanceMetersLatLng,
    isNearOrigin,
    minDistanceToRouteMeters,
} from "@/utils/geo"

describe("geo utils", () => {
    test("haversineDistanceMetersLatLng returns zero for identical points", () => {
        const a = { latitude: 45, longitude: 9 }
        const b = { latitude: 45, longitude: 9 }
        expect(haversineDistanceMetersLatLng(a, b)).toBeCloseTo(0, 6)
    })

    test("haversineDistanceMetersLatLng is symmetric", () => {
        const a = { latitude: 45, longitude: 9 }
        const b = { latitude: 45.0009, longitude: 9.0009 }
        const ab = haversineDistanceMetersLatLng(a, b)
        const ba = haversineDistanceMetersLatLng(b, a)
        expect(ab).toBeCloseTo(ba, 6)
    })

    test("haversineDistanceMeters matches lat/lng wrapper", () => {
        const a = { lat: 45, lng: 9 }
        const b = { latitude: 45.001, longitude: 9.001 }
        const wrapper = haversineDistanceMeters(a, b)
        const direct = haversineDistanceMetersLatLng(
            { latitude: a.lat, longitude: a.lng },
            b
        )
        expect(wrapper).toBeCloseTo(direct, 6)
    })

    test("isNearOrigin returns true when within threshold", () => {
        const origin = { lat: 45, lng: 9 }
        const position = { latitude: 45.0001, longitude: 9.0001 }
        expect(isNearOrigin(origin, position, 1000)).toBe(true)
    })

    test("isNearOrigin returns false when outside threshold", () => {
        const origin = { lat: 45, lng: 9 }
        const position = { latitude: 46, longitude: 10 }
        expect(isNearOrigin(origin, position, 1000)).toBe(false)
    })

    test("minDistanceToRouteMeters returns infinity for empty route", () => {
        expect(minDistanceToRouteMeters([], { latitude: 45, longitude: 9 })).toBe(
            Number.POSITIVE_INFINITY
        )
    })

    test("minDistanceToRouteMeters returns zero if position on route", () => {
        const route = [
            { latitude: 45, longitude: 9 },
            { latitude: 45.001, longitude: 9.001 },
        ]
        const position = { latitude: 45.001, longitude: 9.001 }
        expect(minDistanceToRouteMeters(route, position)).toBeCloseTo(0, 6)
    })
})
