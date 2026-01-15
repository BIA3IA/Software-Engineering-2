import type { PathPoint } from "@/api/paths"

type LatLng = { latitude: number; longitude: number }

export function haversineDistanceMeters(a: PathPoint, b: LatLng) {
    const toRad = (value: number) => (value * Math.PI) / 180
    const lat1 = toRad(a.lat)
    const lon1 = toRad(a.lng)
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

export function isNearOrigin(origin: PathPoint, position: LatLng, thresholdMeters: number) {
    const distance = haversineDistanceMeters(origin, position)
    return distance <= thresholdMeters
}
