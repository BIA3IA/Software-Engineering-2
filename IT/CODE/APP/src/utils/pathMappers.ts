import type { UserPathSummary } from "@/api/paths"
import type { SearchResult } from "@/components/paths/SearchResultsSheet"
import type { RouteItem } from "@/components/route/RouteCard"
import Colors from "@/constants/Colors"
import { buildRouteFromLatLngSegments, buildRouteFromPathPointSegments } from "@/utils/routes"
import { buildStatusTag } from "@/utils/tags"
import { formatDate } from "@/utils/date"

type ThemePalette = typeof Colors.light

export function mapUserPathSummaryToSearchResult(
    path: UserPathSummary,
    palette: ThemePalette
): SearchResult {
    const tags: SearchResult["tags"] = []
    const statusTag = buildStatusTag(path.status, palette)
    if (statusTag) {
        tags.push(statusTag)
    }

    const pathSegments = path.pathSegments?.map((segment) => ({
        pathSegmentId: segment.pathSegmentId,
        segmentId: segment.segmentId,
        polylineCoordinates: (segment.polylineCoordinates ?? segment.segment?.polylineCoordinates ?? []).map(
            (point) => ({
                latitude: point.lat,
                longitude: point.lng,
            })
        ),
    }))

    const routeFromSegments = buildRouteFromLatLngSegments(pathSegments ?? [])
    const fallbackRoute = [
        { latitude: path.origin.lat, longitude: path.origin.lng },
        { latitude: path.destination.lat, longitude: path.destination.lng },
    ]

    return {
        id: path.pathId,
        title: path.title || "Untitled Path",
        description: path.description?.trim() ? path.description : "No description available.",
        tags,
        route: routeFromSegments.length ? routeFromSegments : fallbackRoute,
        pathSegments,
    }
}

export function mapUserPathSummaryToRouteItem(path: UserPathSummary): RouteItem {
    const routeFromSegments = buildRouteFromPathPointSegments(path.pathSegments ?? [])
    const fallbackRoute = [
        { latitude: path.origin.lat, longitude: path.origin.lng },
        { latitude: path.destination.lat, longitude: path.destination.lng },
    ]

    return {
        id: path.pathId,
        name: path.title || "Untitled Path",
        description: path.description ?? undefined,
        distanceKm: path.distanceKm ?? 0,
        durationMin: 0,
        date: formatDate(path.createdAt),
        avgSpeed: 0,
        maxSpeed: 0,
        elevation: 0,
        visibility: path.visibility ? "public" : "private",
        showWeatherBadge: false,
        showPerformanceMetrics: false,
        route: routeFromSegments.length ? routeFromSegments : fallbackRoute,
    }
}
