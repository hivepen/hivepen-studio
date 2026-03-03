import { useQuery } from '@tanstack/react-query'
import { fetchCommunity } from '@/lib/hive/community'

export default function useCommunityQuery(name: string) {
  return useQuery({
    queryKey: ['community', name],
    queryFn: () => fetchCommunity(name),
    enabled: Boolean(name),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
