// Report weighting
export const REPORT_ALPHA = 0.6
export const REPORT_BETA = 0.8
export const REPORT_MIN_RELIABILITY = 0.1
export const REPORT_MAX_RELIABILITY = 2.5
export const REPORT_FRESHNESS_HALF_LIFE_MIN = 1440
export const REPORT_ACTIVE_FRESHNESS_MIN = 0.1

// Report rate-limiting
export const REPORT_COOLDOWN_MIN = 5
export const REPORT_RATE_WINDOW_MIN = 10
export const REPORT_RATE_MAX_PER_WINDOW = 5

// Segment deduplication tolerance (~5m in degrees)
export const SEGMENT_MATCH_TOLERANCE_DEG = 0.00005

// Path search tolerances
export const PATH_SEARCH_TOLERANCE_DEG = 0.002
export const PATH_SEARCH_MAX_DISTANCE_METERS = 200
export const PATH_SEARCH_NEAR_DISTANCE_BUFFER_METERS = 50

// Path status mix weights
export const PATH_STATUS_REPORTED_WEIGHT = 0.7
export const PATH_STATUS_ALL_WEIGHT = 0.3
