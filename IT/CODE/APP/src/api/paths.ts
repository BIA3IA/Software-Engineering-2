import { api } from "./client"

export type PathPoint = {
  lat: number
  lng: number
}

export type PathSegment = {
  start: PathPoint
  end: PathPoint
}

export type CreatePathPayload = {
  visibility: boolean
  creationMode: "manual"
  title: string
  description?: string
  pathSegments: PathSegment[]
}

const PATHS_BASE = "/paths"

export async function createPathApi(payload: CreatePathPayload): Promise<void> {
  await api.post(`${PATHS_BASE}/create`, payload)
}
