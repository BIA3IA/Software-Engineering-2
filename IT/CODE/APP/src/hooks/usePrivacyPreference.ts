import { create } from "zustand"
import { PrivacyPreference, DEFAULT_PRIVACY } from "@/constants/privacy"

type PrivacyPreferenceState = {
  preference: PrivacyPreference
  setPreference: (preference: PrivacyPreference) => void
}

const usePrivacyPreferenceStore = create<PrivacyPreferenceState>((set) => ({
  preference: DEFAULT_PRIVACY,
  setPreference: (preference) => set({ preference }),
}))

export function usePrivacyPreference() {
  return usePrivacyPreferenceStore((state) => state.preference)
}

export function useSetPrivacyPreference() {
  return usePrivacyPreferenceStore((state) => state.setPreference)
}
