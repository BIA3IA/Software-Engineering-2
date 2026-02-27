import { api } from "./client"
import type { ReportSummary } from "./reports"
import type { PathPoint } from "./paths"

export type TripSegmentPayload = {
  segmentId: string
  polylineCoordinates: PathPoint[]
}

export type TripStats = {
  avgSpeed: number
  kilometers: number
  duration: number
}

export type TripSummary = {
  tripId: string
  createdAt: string
  startedAt: string
  finishedAt: string
  title?: string | null
  origin: PathPoint
  destination: PathPoint
  stats: TripStats | null
  weather: unknown | null
  segmentCount: number
  tripSegments?: {
    segmentId: string
    polylineCoordinates: PathPoint[]
  }[]
  reports?: ReportSummary[]
}

type TripsResponse = {
  data: {
    count: number
    trips: TripSummary[]
  }
}

export type CreateTripPayload = {
  origin: PathPoint
  destination: PathPoint
  startedAt: string
  finishedAt: string
  title?: string | null
  tripSegments: TripSegmentPayload[]
}

type CreateTripResponse = {
  data: {
    tripId: string
  }
}

const TRIPS_BASE = "/trips"

export async function createTripApi(payload: CreateTripPayload): Promise<string> {
  const res = await api.post<CreateTripResponse>(`${TRIPS_BASE}`, payload)
  return res.data.data.tripId
}

export async function getMyTripsApi(): Promise<TripSummary[]> {
  const res = await api.get<TripsResponse>(`${TRIPS_BASE}`, {
    params: { owner: "me" },
  })
  return res.data.data.trips
}

export async function deleteTripApi(tripId: string): Promise<void> {
  await api.delete(`${TRIPS_BASE}/${tripId}`)
}
