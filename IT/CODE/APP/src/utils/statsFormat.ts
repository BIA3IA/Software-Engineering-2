export function formatKm(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 km"
  return `${value.toFixed(1)} km`
}

export function formatSpeed(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 km/h"
  return `${value.toFixed(1)} km/h`
}

export function formatCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0"
  return `${Math.round(value)}`
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m"
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours > 0) {
    return `${hours}h ${remaining}m`
  }
  return `${remaining}m`
}
