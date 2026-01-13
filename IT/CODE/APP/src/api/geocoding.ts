import * as Location from "expo-location"

export type GeocodeResult = {
  lat: number
  lng: number
  displayName?: string
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const DEFAULT_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "it",
  "User-Agent": "bbp-app",
} as const

type NominatimResult = {
  lat: string
  lon: string
  display_name?: string
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim()
  if (!trimmed) return null

  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    q: trimmed,
  })
  const url = `${NOMINATIM_URL}?${params.toString()}`
  const res = await fetch(url, { headers: DEFAULT_HEADERS })
  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`)
  }
  const data = (await res.json()) as NominatimResult[]
  if (!Array.isArray(data) || data.length === 0) {
    const fallback = await Location.geocodeAsync(trimmed)
    const firstFallback = fallback[0]
    if (!firstFallback) return null
    return {
      lat: firstFallback.latitude,
      lng: firstFallback.longitude,
    }
  }

  const first = data[0]
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    lat,
    lng,
    displayName: first.display_name,
  }
}
