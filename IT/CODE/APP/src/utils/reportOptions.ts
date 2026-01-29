export const ISSUE_CONDITION_OPTIONS = [
  { key: "MEDIUM", label: "Medium" },
  { key: "SUFFICIENT", label: "Sufficient" },
  { key: "REQUIRES_MAINTENANCE", label: "Requires Maintenance" },
  { key: "CLOSED", label: "Closed" },
]

export const OBSTACLE_TYPE_OPTIONS = [
  { key: "POTHOLE", label: "Pothole" },
  { key: "WORK_IN_PROGRESS", label: "Work in Progress" },
  { key: "FLOODING", label: "Flooding" },
  { key: "OBSTACLE", label: "Obstacle" },
  { key: "OTHER", label: "Other" },
]

export function getObstacleLabel(obstacleType?: string) {
  return OBSTACLE_TYPE_OPTIONS.find((option) => option.key === obstacleType)?.label ?? obstacleType ?? "Unknown"
}

export function getConditionLabel(condition?: string) {
  return ISSUE_CONDITION_OPTIONS.find((option) => option.key === condition)?.label ?? condition ?? "Unknown"
}
