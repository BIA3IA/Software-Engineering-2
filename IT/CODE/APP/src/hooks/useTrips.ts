import { useQuery } from '@tanstack/react-query'
import { getMyTripsApi } from '../api/trips'

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      return getMyTripsApi()
    },
  })
}
