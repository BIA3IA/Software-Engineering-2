import { create } from "zustand"

type MutationTrackerState = {
  activeCount: number
  begin: () => void
  end: () => void
}

export const useMutationTracker = create<MutationTrackerState>((set) => ({
  activeCount: 0,
  begin: () => set((state) => ({ activeCount: state.activeCount + 1 })),
  end: () =>
    set((state) => ({ activeCount: state.activeCount > 0 ? state.activeCount - 1 : 0 })),
}))

export function beginMutation() {
  useMutationTracker.getState().begin()
}

export function endMutation() {
  useMutationTracker.getState().end()
}

export function useIsMutationBlocking() {
  return useMutationTracker((state) => state.activeCount > 0)
}
