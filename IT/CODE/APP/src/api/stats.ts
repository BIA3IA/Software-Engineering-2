import { api } from "./client"

export type StatsPeriodKey = "day" | "week" | "month" | "year" | "overall"

export type StatsPeriod = {
  id?: string | null
  userId: string
  period: string
  avgSpeed: number
  avgDuration: number
  avgKilometers: number
  totalKilometers: number
  totalTime: number
  longestKilometer: number
  longestTime: number
  pathsCreated: number
  tripCount: number
  updatedAt: string
}

export type StatsResponse = {
  success: boolean
  data: Record<StatsPeriodKey, StatsPeriod>
}

const STATS_BASE = "/stats"

export async function getStatsApi(): Promise<Record<StatsPeriodKey, StatsPeriod>> {
  const res = await api.get<StatsResponse>(STATS_BASE)
  return res.data.data
}
