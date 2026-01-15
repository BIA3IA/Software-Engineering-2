import { api } from "./client"
import type { PathPoint } from "./paths"

export type TripSegmentPayload = {
  segmentId: string
  polylineCoordinates: PathPoint[]
}

export type TripStatistics = {
  speed: number
  maxSpeed: number
  distance: number
  time: number
}

export type TripSummary = {
  tripId: string
  createdAt: string
  startedAt: string
  finishedAt: string
  origin: PathPoint
  destination: PathPoint
  statistics: TripStatistics | null
  weather: unknown | null
  segmentCount: number
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

const TRIPS_BASE = "/trips"

export async function createTripApi(payload: CreateTripPayload): Promise<void> {
  console.log("createTrip payload", payload)
  await api.post(`${TRIPS_BASE}/create`, payload)
}

export async function getMyTripsApi(): Promise<TripSummary[]> {
  const res = await api.get<TripsResponse>(`${TRIPS_BASE}/my-trips`)
  return res.data.data.trips
}

export async function deleteTripApi(tripId: string): Promise<void> {
  await api.delete(`${TRIPS_BASE}/${tripId}`)
}
