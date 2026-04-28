import { useQuery } from '@tanstack/react-query'
import {
  fetchAccountRewardTimeline,
  readRewardTimelineSnapshot,
  writeRewardTimelineSnapshot,
} from './rewards'

export default function useAccountRewardTimeline(username?: string | null) {
  const normalized = (username ?? '').trim().replace(/^@/, '').toLowerCase()
  const cached = normalized ? readRewardTimelineSnapshot(normalized) : null

  const query = useQuery({
    queryKey: ['analytics', 'reward-timeline', normalized],
    enabled: normalized.length > 0,
    initialData: cached ?? undefined,
    initialDataUpdatedAt: cached?.cachedAt,
    staleTime: 0,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const data = await fetchAccountRewardTimeline(normalized)
      writeRewardTimelineSnapshot(normalized, data)
      return data
    },
  })

  return {
    timeline: query.data?.timeline ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading && !query.data,
    isRefreshing: query.isFetching && Boolean(query.data),
    lastUpdatedAt: query.data?.cachedAt ?? null,
  }
}
