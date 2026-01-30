import React from "react"
import type MapView from "react-native-maps"
import { haversineDistanceMetersLatLng } from "@/utils/geo"

type LatLng = { latitude: number; longitude: number }

type FollowOptions = {
  enabled: boolean
  mapRef: React.MutableRefObject<MapView | null>
  target: LatLng | null
  ready?: boolean
  zoom: number
  heading?: number | null
  pitch?: number
  snapOnEnable?: boolean
  minDistanceMeters?: number
  minIntervalMs?: number
  durationMs?: number
  disableGestures?: boolean
}

export function useFollowUserLocation({
  enabled,
  mapRef,
  target,
  ready = true,
  zoom,
  heading,
  pitch = 0,
  snapOnEnable = true,
  minDistanceMeters = 6,
  minIntervalMs = 400,
  durationMs = 250,
  disableGestures = true,
}: FollowOptions) {
  const lastFollowAtRef = React.useRef(0)
  const lastCenterRef = React.useRef<LatLng | null>(null)
  const lastHeadingRef = React.useRef<number | null>(null)
  const lastEnabledRef = React.useRef(false)

  React.useEffect(() => {
    const wasEnabled = lastEnabledRef.current
    lastEnabledRef.current = enabled
    if (!ready || !enabled || !mapRef.current || !target) return
    const now = Date.now()
    const lastCenter = lastCenterRef.current
    const distance =
      lastCenter ? haversineDistanceMetersLatLng(lastCenter, target) : Number.POSITIVE_INFINITY
    const headingDiff =
      lastHeadingRef.current !== null && heading !== null && heading !== undefined
        ? Math.abs(lastHeadingRef.current - heading)
        : Number.POSITIVE_INFINITY
    const justEnabled = !wasEnabled && enabled
    const firstTarget = lastCenterRef.current === null
    const shouldFollow =
      (justEnabled && snapOnEnable) || firstTarget
        ? true
        : now - lastFollowAtRef.current > minIntervalMs ||
          distance > minDistanceMeters ||
          headingDiff > 6

    if (!shouldFollow) return

    lastFollowAtRef.current = now
    lastCenterRef.current = target
    lastHeadingRef.current = heading ?? null
    lastEnabledRef.current = enabled

    mapRef.current.animateCamera(
      {
        center: target,
        zoom,
        heading: heading ?? 0,
        pitch,
      },
      { duration: durationMs }
    )
  }, [
    enabled,
    mapRef,
    target,
    ready,
    zoom,
    heading,
    pitch,
    snapOnEnable,
    minDistanceMeters,
    minIntervalMs,
    durationMs,
  ])

  return {
    followsUserLocation: enabled,
    gesturesDisabled: enabled && disableGestures,
  }
}
