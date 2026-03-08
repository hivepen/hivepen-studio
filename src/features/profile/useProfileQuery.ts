import { useQuery } from '@tanstack/react-query'
import { getProfilesQueryOptions, type Profile } from '@ecency/sdk'
import { mapProfile } from '@/features/profile/profileMapping'
import { type AccountProfile } from '@/features/profile/profileTypes'

export default function useProfileQuery(username?: string | null) {
  const normalized = (username ?? '').trim().replace(/^@/, '')
  const enabled = normalized.length > 0
  const baseOptions = getProfilesQueryOptions([normalized], undefined, enabled)

  return useQuery({
    ...(baseOptions as object),
    enabled,
    select: (data: Profile[]): AccountProfile | null =>
      data?.[0] ? mapProfile(data[0]) : null,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
