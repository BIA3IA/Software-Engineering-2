import { api } from "@/api/client"
import { attachReportsToTripApi, confirmReportApi, createReportApi, getReportsByPathApi } from "@/api/reports"

jest.mock("@/api/client", () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe("api/reports", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("createReportApi posts payload and returns reportId", async () => {
    ;(api.post as jest.Mock).mockResolvedValueOnce({
      data: { data: { reportId: "r1", createdAt: "2025-01-20T10:00:00Z" } },
    })

    const out = await createReportApi({
      segmentId: "seg1",
      sessionId: "s1",
      obstacleType: "POTHOLE",
      position: { lat: 45.0, lng: 9.0 },
      condition: "MEDIUM",
    })

    expect(api.post).toHaveBeenCalledWith("/reports", {
      segmentId: "seg1",
      sessionId: "s1",
      obstacleType: "POTHOLE",
      position: { lat: 45.0, lng: 9.0 },
      condition: "MEDIUM",
    })
    expect(out).toBe("r1")
  })

  test("attachReportsToTripApi posts payload and returns updatedCount", async () => {
    ;(api.post as jest.Mock).mockResolvedValueOnce({
      data: { data: { updatedCount: 2 } },
    })

    const out = await attachReportsToTripApi({ sessionId: "s1", tripId: "t1" })

    expect(api.post).toHaveBeenCalledWith("/reports/attach", { sessionId: "s1", tripId: "t1" })
    expect(out).toBe(2)
  })

  test("confirmReportApi posts decision payload", async () => {
    ;(api.post as jest.Mock).mockResolvedValueOnce({ data: {} })

    await confirmReportApi("r1", { decision: "CONFIRMED", sessionId: "s1" })

    expect(api.post).toHaveBeenCalledWith("/reports/r1/confirm", {
      decision: "CONFIRMED",
      sessionId: "s1",
    })
  })

  test("getReportsByPathApi gets list with params", async () => {
    ;(api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: [
          {
            reportId: "r1",
            createdAt: "2025-01-20T10:00:00Z",
            obstacleType: "POTHOLE",
            pathStatus: "MEDIUM",
            status: "ACTIVE",
            position: { lat: 45.0, lng: 9.0 },
          },
        ],
      },
    })

    const out = await getReportsByPathApi("p1")

    expect(api.get).toHaveBeenCalledWith("/reports", { params: { pathId: "p1" } })
    expect(out).toHaveLength(1)
    expect(out[0].reportId).toBe("r1")
  })
})
