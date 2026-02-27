import React from "react"
import { render } from "@testing-library/react-native"
import MapView from "react-native-maps"
import { useFollowUserLocation } from "@/hooks/useFollowUserLocation"

const mockAnimateCamera = jest.fn()

jest.mock("react-native-maps", () => {
  const React = require("react")
  const { View } = require("react-native")
  const MockMap = React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      animateCamera: mockAnimateCamera,
    }))
    return React.createElement(View, null)
  })
  MockMap.displayName = "MockMap"
  return {
    __esModule: true,
    default: MockMap,
  }
})

function TestHarness({
  enabled,
  target,
  ready,
  heading,
}: {
  enabled: boolean
  target: { latitude: number; longitude: number } | null
  ready: boolean
  heading?: number | null
}) {
  const mapRef = React.useRef<MapView | null>(null)
  useFollowUserLocation({
    enabled,
    mapRef,
    target,
    ready,
    zoom: 19.5,
    heading,
    pitch: 20,
    minDistanceMeters: 0,
    minIntervalMs: 0,
    durationMs: 0,
    disableGestures: false,
  })
  return <MapView ref={mapRef} />
}

describe("useFollowUserLocation", () => {
  test("snaps on enable when target is available", () => {
    mockAnimateCamera.mockClear()
    const { rerender } = render(
      <TestHarness enabled={false} ready target={{ latitude: 45, longitude: 9 }} />
    )

    rerender(<TestHarness enabled ready target={{ latitude: 45, longitude: 9 }} />)
    expect(mockAnimateCamera).toHaveBeenCalled()
  })
})
