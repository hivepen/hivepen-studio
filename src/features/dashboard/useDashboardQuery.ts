import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardOverview,
  readDashboardSnapshot,
  writeDashboardSnapshot,
} from './overview'
import type { DashboardRange } from './types'

export default function useDashboardQuery(
  username: string | null | undefined,
  range: DashboardRange,
) {
  const normalized = (username ?? '').trim().replace(/^@/, '').toLowerCase()
  const cached = normalized ? readDashboardSnapshot(normalized, range) : null

  const query = useQuery({
    queryKey: ['dashboard', normalized, range],
    enabled: normalized.length > 0,
    initialData: cached ?? undefined,
    initialDataUpdatedAt: cached?.cachedAt,
    staleTime: 0,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const data = await fetchDashboardOverview(normalized, range)
      writeDashboardSnapshot(normalized, data)
      return data
    },
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading && !query.data,
    isRefreshing: query.isFetching && Boolean(query.data),
    lastUpdatedAt: query.data?.cachedAt ?? null,
  }
}
