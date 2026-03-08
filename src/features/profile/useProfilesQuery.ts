import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProfilesQueryOptions, type Profile } from '@ecency/sdk'
import { mapProfile } from '@/features/profile/profileMapping'
import { type AccountProfile } from '@/features/profile/profileTypes'

export default function useProfilesQuery(accounts: string[]) {
  const normalized = useMemo(() => {
    const unique = new Set<string>()
    accounts
      .map((account) => account.trim().replace(/^@/, ''))
      .filter(Boolean)
      .forEach((account) => unique.add(account))
    return Array.from(unique)
  }, [accounts])

  const enabled = normalized.length > 0
  const baseOptions = getProfilesQueryOptions(normalized, undefined, enabled)

  return useQuery({
    ...(baseOptions as object),
    enabled,
    select: (data: Profile[]): AccountProfile[] => data.map(mapProfile),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
