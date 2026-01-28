import { api } from "./client"

export type ReportPosition = {
  lat: number
  lng: number
}

export type CreateReportPayload = {
  pathSegmentId?: string
  pathId?: string
  segmentId?: string
  sessionId: string
  obstacleType: string
  position: ReportPosition
  pathStatus?: string
  condition?: string
  tripId?: string
}

export type ReportSummary = {
  reportId: string
  createdAt: string
  obstacleType: string
  pathStatus: string
  status: string
  position: { lat: number; lng: number }
}

type ConfirmReportPayload = {
  decision: "CONFIRMED" | "REJECTED"
  tripId?: string
  sessionId?: string
}

type CreateReportResponse = {
  data: {
    reportId: string
    createdAt: string
  }
}

type AttachReportsPayload = {
  sessionId: string
  tripId: string
}

type AttachReportsResponse = {
  data: {
    updatedCount: number
  }
}

type ReportsByPathResponse = {
  data: ReportSummary[]
}

const REPORTS_BASE = "/reports"

export async function createReportApi(payload: CreateReportPayload): Promise<string> {
  const res = await api.post<CreateReportResponse>(`${REPORTS_BASE}`, payload)
  return res.data.data.reportId
}

export async function attachReportsToTripApi(payload: AttachReportsPayload): Promise<number> {
  const res = await api.post<AttachReportsResponse>(`${REPORTS_BASE}/attach`, payload)
  return res.data.data.updatedCount
}

export async function confirmReportApi(reportId: string, payload: ConfirmReportPayload): Promise<void> {
  await api.post(`${REPORTS_BASE}/${reportId}/confirm`, payload)
}

export async function getReportsByPathApi(pathId: string): Promise<ReportSummary[]> {
  const res = await api.get<ReportsByPathResponse>(`${REPORTS_BASE}`, { params: { pathId } })
  return res.data.data
}
