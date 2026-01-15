import { api } from "./client"

export type PathPoint = {
  lat: number
  lng: number
}

export type PathSegment = {
  start: PathPoint
  end: PathPoint
}

export type SnapPathPayload = {
  coordinates: PathPoint[]
}

type SnapPathResponse = {
  data: {
    coordinates: PathPoint[]
  }
}

export type CreatePathPayload = {
  visibility: boolean
  creationMode: "manual"
  title: string
  description?: string
  pathSegments: PathSegment[]
}

export type UserPathSummary = {
  pathId: string
  title: string
  description?: string | null
  status: string
  score: number | null
  distanceKm?: number
  visibility: boolean
  origin: PathPoint
  destination: PathPoint
  createdAt: string
  segmentCount: number
  pathSegments?: Array<{
    segmentId: string
    nextSegmentId: string | null
    polylineCoordinates?: PathPoint[]
    segment?: {
      polylineCoordinates: PathPoint[]
    }
  }>
}

type UserPathsResponse = {
  data: {
    count: number
    paths: UserPathSummary[]
  }
}

export type SearchPathsParams = {
  origin: string
  destination: string
}

const PATHS_BASE = "/paths"

export async function createPathApi(payload: CreatePathPayload): Promise<void> {
  await api.post(`${PATHS_BASE}/create`, payload)
}

export async function getMyPathsApi(): Promise<UserPathSummary[]> {
  const res = await api.get<UserPathsResponse>(`${PATHS_BASE}/my-paths`)
  return res.data.data.paths
}

export async function searchPathsApi(params: SearchPathsParams): Promise<UserPathSummary[]> {
  const res = await api.get<UserPathsResponse>(`${PATHS_BASE}/search`, { params })
  return res.data.data.paths
}

export async function snapPathApi(payload: SnapPathPayload): Promise<PathPoint[]> {
  const res = await api.post<SnapPathResponse>(`${PATHS_BASE}/snap`, payload)
  return res.data.data.coordinates
}

export async function deletePathApi(pathId: string): Promise<void> {
  await api.delete(`${PATHS_BASE}/${pathId}`)
}

export async function changePathVisibilityApi(pathId: string, visibility: boolean): Promise<void> {
  await api.patch(`${PATHS_BASE}/${pathId}/visibility`, { visibility })
}
