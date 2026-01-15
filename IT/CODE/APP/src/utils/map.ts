type LatLng = { latitude: number; longitude: number }

export function regionCenteredOnDestination(route: LatLng[]) {
    if (!route.length) {
        return {
            latitude: 45.478,
            longitude: 9.227,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }
    }

    const destination = route[route.length - 1]
    let minLat = route[0].latitude
    let maxLat = route[0].latitude
    let minLng = route[0].longitude
    let maxLng = route[0].longitude

    for (const point of route) {
        minLat = Math.min(minLat, point.latitude)
        maxLat = Math.max(maxLat, point.latitude)
        minLng = Math.min(minLng, point.longitude)
        maxLng = Math.max(maxLng, point.longitude)
    }

    const latDelta = Math.max(0.01, (maxLat - minLat) * 2.4)
    const lngDelta = Math.max(0.01, (maxLng - minLng) * 2.4)

    return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
    }
}

export function regionAroundPoint(point: LatLng, delta = 0.01) {
    return {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
    }
}

export function normalizeSearchResult<T extends { route: LatLng[]; pathSegments?: Array<{ polylineCoordinates: LatLng[] }> }>(
    result: T,
    buildRouteFromSegments: (segments: Array<{ polylineCoordinates: LatLng[] }>) => LatLng[]
) {
    if (result.route.length > 1 || !result.pathSegments?.length) {
        return result
    }

    const routeFromSegments = buildRouteFromSegments(result.pathSegments)
    return {
        ...result,
        route: routeFromSegments.length ? routeFromSegments : result.route,
    }
}

export function findClosestPointIndex(route: LatLng[], position: LatLng) {
    if (!route.length) return 0
    let minIndex = 0
    let minDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < route.length; i++) {
        const point = route[i]
        const distance = Math.hypot(point.latitude - position.latitude, point.longitude - position.longitude)
        if (distance < minDistance) {
            minDistance = distance
            minIndex = i
        }
    }

    return minIndex
}
