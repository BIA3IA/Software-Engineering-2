type LatLng = { latitude: number; longitude: number }
type PathPoint = { lat: number; lng: number }

function pushUnique(points: LatLng[], point: LatLng) {
    const last = points[points.length - 1]
    if (!last || last.latitude !== point.latitude || last.longitude !== point.longitude) {
        points.push(point)
    }
}

export function buildRouteFromLatLngSegments(
    segments: { polylineCoordinates: LatLng[] }[]
) {
    const points: LatLng[] = []

    for (const segment of segments) {
        for (const point of segment.polylineCoordinates) {
            pushUnique(points, point)
        }
    }

    return points
}

export function buildRouteFromPathPointSegments(
    segments: { polylineCoordinates?: PathPoint[] }[]
) {
    const points: LatLng[] = []

    for (const segment of segments) {
        const polyline = segment.polylineCoordinates ?? []
        for (const point of polyline) {
            pushUnique(points, { latitude: point.lat, longitude: point.lng })
        }
    }

    return points
}
