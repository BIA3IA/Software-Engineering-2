export type PrivacyPreference = "public" | "private"

export const PRIVACY_OPTIONS: { key: PrivacyPreference; label: string }[] = [
  { key: "public", label: "Public" },
  { key: "private", label: "Private" },
]

export const DEFAULT_PRIVACY: PrivacyPreference = "public"
