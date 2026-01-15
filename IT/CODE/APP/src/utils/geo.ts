import type { PathPoint } from "@/api/paths"

type LatLng = { latitude: number; longitude: number }

export function haversineDistanceMeters(a: PathPoint, b: LatLng) {
    return haversineDistanceMetersLatLng(
        { latitude: a.lat, longitude: a.lng },
        b
    )
}

export function isNearOrigin(origin: PathPoint, position: LatLng, thresholdMeters: number) {
    const distance = haversineDistanceMeters(origin, position)
    return distance <= thresholdMeters
}

export function haversineDistanceMetersLatLng(a: LatLng, b: LatLng) {
    const toRad = (value: number) => (value * Math.PI) / 180
    const lat1 = toRad(a.latitude)
    const lon1 = toRad(a.longitude)
    const lat2 = toRad(b.latitude)
    const lon2 = toRad(b.longitude)

    const dLat = lat2 - lat1
    const dLon = lon2 - lon1
    const sinLat = Math.sin(dLat / 2)
    const sinLon = Math.sin(dLon / 2)
    const aVal = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))

    return 6371000 * c
}

export function minDistanceToRouteMeters(route: LatLng[], position: LatLng) {
    if (!route.length) return Number.POSITIVE_INFINITY
    let minDistance = Number.POSITIVE_INFINITY
    for (const point of route) {
        const distance = haversineDistanceMetersLatLng(point, position)
        if (distance < minDistance) {
            minDistance = distance
        }
    }
    return minDistance
}
