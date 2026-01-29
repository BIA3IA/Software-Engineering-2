import { getConditionLabel, getObstacleLabel, ISSUE_CONDITION_OPTIONS, OBSTACLE_TYPE_OPTIONS } from "@/utils/reportOptions"

describe("reportOptions", () => {
  test("getObstacleLabel returns label for known key", () => {
    expect(getObstacleLabel("POTHOLE")).toBe(
      OBSTACLE_TYPE_OPTIONS.find((o) => o.key === "POTHOLE")?.label
    )
  })

  test("getObstacleLabel falls back to unknown", () => {
    expect(getObstacleLabel("UNKNOWN_KEY")).toBe("UNKNOWN_KEY")
    expect(getObstacleLabel(undefined)).toBe("Unknown")
  })

  test("getConditionLabel returns label for known key", () => {
    expect(getConditionLabel("MEDIUM")).toBe(
      ISSUE_CONDITION_OPTIONS.find((o) => o.key === "MEDIUM")?.label
    )
  })

  test("getConditionLabel falls back to unknown", () => {
    expect(getConditionLabel("UNKNOWN_KEY")).toBe("UNKNOWN_KEY")
    expect(getConditionLabel(undefined)).toBe("Unknown")
  })
})
