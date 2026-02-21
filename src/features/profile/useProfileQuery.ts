import { useQuery } from '@tanstack/react-query'
import { getAccountProfile } from '@/lib/hive/account'

export default function useProfileQuery(username: string) {
  const normalized = username.trim().replace(/^@/, '')
  return useQuery({
    queryKey: ['profile', normalized],
    enabled: normalized.length > 0,
    queryFn: () => getAccountProfile(normalized),
  })
}
