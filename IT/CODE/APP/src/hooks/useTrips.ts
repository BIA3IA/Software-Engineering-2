import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get('/trips')
      return res.data
    },
  })
}
