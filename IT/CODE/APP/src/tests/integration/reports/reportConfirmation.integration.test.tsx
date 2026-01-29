import React from "react"
import { render, fireEvent, waitFor, cleanup, act } from "@testing-library/react-native"
import HomeScreen from "@/app/(main)/home"
import { confirmReportApi, getReportsByPathApi } from "@/api/reports"

jest.mock("@/api/reports", () => ({
  confirmReportApi: jest.fn(),
  getReportsByPathApi: jest.fn(),
}))

jest.mock("@/api/paths", () => ({
  searchPathsApi: jest.fn(),
}))

jest.mock("@/api/trips", () => ({
  createTripApi: jest.fn(),
}))

jest.mock("@/constants/appConfig", () => ({
  ...jest.requireActual("@/constants/appConfig"),
  REPORT_CONFIRM_DISMISS_MS: 50,
}))

jest.mock("@/hooks/useBottomNavVisibility", () => ({
  useBottomNavVisibility: () => ({ setHidden: jest.fn() }),
}))

jest.mock("@/hooks/useLoginPrompt", () => ({
  useLoginPrompt: () => jest.fn(),
}))

jest.mock("@/components/paths/SearchResultsSheet", () => ({
  SearchResultsSheet: () => null,
}))

jest.mock("@/components/modals/CreatePathModal", () => ({
  CreatePathModal: () => null,
}))

jest.mock("@/components/modals/ReportIssueModal", () => ({
  ReportIssueModal: () => null,
}))

let mockLocation = { latitude: 45.0, longitude: 9.0, heading: 0 }
let locationCallback: any = null

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: mockLocation,
  })),
  watchPositionAsync: jest.fn(async (_options: any, callback: any) => {
    locationCallback = callback
    callback?.({ coords: mockLocation })
    return { remove: jest.fn() }
  }),
  reverseGeocodeAsync: jest.fn(async () => []),
  LocationAccuracy: { Balanced: "balanced" },
}))

let mockUser: { id: string; username?: string; email?: string } | null = {
  id: "u1",
  username: "Test",
  email: "test@example.com",
}

jest.mock("@/auth/storage", () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: mockUser,
    }),
}))

let mockTripSelection: any = null
const mockSetTripLaunchSelection = jest.fn((value) => {
  mockTripSelection = value
})

jest.mock("@/hooks/useTripLaunchSelection", () => ({
  useTripLaunchSelection: () => mockTripSelection,
  useSetTripLaunchSelection: () => mockSetTripLaunchSelection,
}))

jest.mock("react-native-maps", () => {
  const React = require("react")
  const { View } = require("react-native")
  const MockMap = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      pointForCoordinate: async () => ({ x: 0, y: 0 }),
      animateToRegion: jest.fn(),
      animateCamera: jest.fn(),
    }))
    return React.createElement(View, null, props.children)
  })
  const Mock = (props: any) => React.createElement(View, null, props.children)
  return {
    __esModule: true,
    default: MockMap,
    Marker: Mock,
    Polyline: Mock,
    Circle: Mock,
    PROVIDER_GOOGLE: "google",
  }
})

describe("report confirmation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUser = { id: "u1", username: "Test", email: "test@example.com" }
    mockLocation = { latitude: 45.0, longitude: 9.0, heading: 0 }
    locationCallback = null
    mockTripSelection = {
      id: "p1",
      title: "Test Path",
      description: "Test",
      tags: [],
      route: [
        { latitude: 45.0, longitude: 9.0 },
        { latitude: 45.001, longitude: 9.001 },
      ],
      pathSegments: [
        {
          segmentId: "seg1",
          polylineCoordinates: [
            { latitude: 45.0, longitude: 9.0 },
            { latitude: 45.001, longitude: 9.001 },
          ],
        },
      ],
    }
  })

  afterEach(() => {
    cleanup()
  })

  function emitLocation(lat: number, lng: number) {
    mockLocation = { latitude: lat, longitude: lng, heading: 0 }
    locationCallback?.({ coords: mockLocation })
  }

  test("shows confirmation popup and confirms report", async () => {
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r1",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])
    ;(confirmReportApi as jest.Mock).mockResolvedValueOnce(undefined)

    const { findByText, getByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report check")).toBeTruthy()
    fireEvent.press(getByText("Yes"))

    await waitFor(() => {
      expect(confirmReportApi).toHaveBeenCalledWith("r1", {
        decision: "CONFIRMED",
        sessionId: undefined,
      })
    })
  })

  test("rejects report on No", async () => {
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r2",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])
    ;(confirmReportApi as jest.Mock).mockResolvedValueOnce(undefined)

    const { findByText, getByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report check")).toBeTruthy()
    fireEvent.press(getByText("No"))

    await waitFor(() => {
      expect(confirmReportApi).toHaveBeenCalledWith("r2", {
        decision: "REJECTED",
        sessionId: undefined,
      })
    })
  })

  test("shows error popup when confirm fails", async () => {
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r3",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])
    ;(confirmReportApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

    const { findByText, getByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report check")).toBeTruthy()
    fireEvent.press(getByText("Yes"))

    expect(await findByText("Report Error")).toBeTruthy()
    expect(await findByText("API error")).toBeTruthy()
  })

  test("reports load error shows popup", async () => {
    ;(getReportsByPathApi as jest.Mock).mockRejectedValueOnce(new Error("fail"))

    const { findByText } = render(<HomeScreen />)

    expect(await findByText("Reports Error")).toBeTruthy()
    expect(await findByText("API error")).toBeTruthy()
  })

  test("confirmation auto-dismisses after timeout", async () => {
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r5",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])

    const { findByText, queryByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report check")).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(queryByText("Report check")).toBeNull()
  })

  test("does not prompt same report twice", async () => {
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r6",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])

    const { findByText, queryByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report check")).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(queryByText("Report check")).toBeNull()

    act(() => {
      emitLocation(45.0, 9.0)
    })

    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(queryByText("Report check")).toBeNull()
  })

  test("guest sees info-only prompt and no confirm api call", async () => {
    mockUser = { id: "guest", username: "Guest", email: "" }
    ;(getReportsByPathApi as jest.Mock).mockResolvedValueOnce([
      {
        reportId: "r4",
        createdAt: "2025-01-20T10:00:00Z",
        obstacleType: "POTHOLE",
        pathStatus: "MEDIUM",
        status: "ACTIVE",
        position: { lat: 45.0, lng: 9.0 },
      },
    ])

    const { findByText, getByText } = render(<HomeScreen />)

    await waitFor(() => {
      expect(getReportsByPathApi).toHaveBeenCalledWith("p1")
    })
    act(() => {
      emitLocation(45.0, 9.0)
    })

    expect(await findByText("Report nearby")).toBeTruthy()
    expect(await findByText(/Pothole/i)).toBeTruthy()

    fireEvent.press(getByText("Got it"))

    expect(confirmReportApi).not.toHaveBeenCalled()
  })
})
