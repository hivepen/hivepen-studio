import { useQuery } from '@tanstack/react-query'
import { getProfilesQueryOptions } from '@ecency/sdk'
import type { Profile } from '@ecency/sdk'
import type { AccountProfile } from '@/features/profile/profileTypes'
import { mapProfile } from '@/features/profile/profileMapping'

export default function useProfileQuery(username?: string | null) {
  const normalized = (username ?? '').trim().replace(/^@/, '')
  const enabled = normalized.length > 0
  const baseOptions = getProfilesQueryOptions([normalized], undefined, enabled)

  return useQuery({
    ...baseOptions,
    enabled,
    select: (data: Array<Profile>): AccountProfile | null =>
      data[0] ? mapProfile(data[0]) : null,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
