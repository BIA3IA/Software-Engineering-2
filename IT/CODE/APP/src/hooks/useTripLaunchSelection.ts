import { create } from "zustand"
import type { SearchResult } from "@/components/paths/SearchResultsSheet"

type TripLaunchState = {
    selectedPath: SearchResult | null
    setSelectedPath: (path: SearchResult | null) => void
}

const useTripLaunchStore = create<TripLaunchState>((set) => ({
    selectedPath: null,
    setSelectedPath: (path) => set({ selectedPath: path }),
}))

export function useTripLaunchSelection() {
    return useTripLaunchStore((state) => state.selectedPath)
}

export function useSetTripLaunchSelection() {
    return useTripLaunchStore((state) => state.setSelectedPath)
}
