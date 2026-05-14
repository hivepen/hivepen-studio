import { createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { HiveCommunity } from '@/lib/hive/client'
import type { AccountProfile } from '@/features/profile/profileTypes'
import { getCommunityIdentifier, listCommunities } from '@/lib/hive/client'
import DevOnly from '@/components/DevOnly'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import SearchPanel from '@/components/SearchPanel'
import CommunityCard from '@/components/CommunityCard'
import useProfilesQuery from '@/features/profile/useProfilesQuery'
import { discoveryCache } from '@/features/discovery-cache'
import useDiscoverySnapshot from '@/features/discovery-cache/useDiscoverySnapshot'

export const Route = createFileRoute('/communities/')({
  component: Communities,
})

function Communities() {
  const [query, setQuery, queryReady] = useLocalStorageState(
    'hivepen.communities.query',
    '',
  )
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const trimmedQuery = query.trim()
  const { snapshot: cachedCommunities, refresh: refreshCachedCommunities } =
    useDiscoverySnapshot('communities', trimmedQuery, trimmedQuery ? 20 : 9)

  useEffect(() => {
    if (!queryReady) return
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(handle)
  }, [query, queryReady])

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'search', debouncedQuery],
    queryFn: () => listCommunities(debouncedQuery),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  useEffect(() => {
    if (!communitiesQuery.data || debouncedQuery.length < 2) return
    discoveryCache.cacheSearchResults(
      'communities',
      debouncedQuery,
      communitiesQuery.data,
    )
    refreshCachedCommunities()
  }, [communitiesQuery.data, debouncedQuery, refreshCachedCommunities])

  const results = useMemo(() => {
    if (
      trimmedQuery === debouncedQuery &&
      communitiesQuery.data !== undefined
    ) {
      return communitiesQuery.data
    }
    return cachedCommunities.results
  }, [
    cachedCommunities.results,
    communitiesQuery.data,
    debouncedQuery,
    trimmedQuery,
  ])
  const communityIds = useMemo(
    () =>
      results
        .map((community) => getCommunityIdentifier(community))
        .filter(Boolean),
    [results],
  )
  const profilesQuery = useProfilesQuery(communityIds)
  const profilesByName = useMemo(() => {
    const map = new Map<string, AccountProfile>()
    ;(profilesQuery.data ?? []).forEach((profile) => {
      map.set(profile.name, profile)
    })
    return map
  }, [profilesQuery.data])

  const handleCommunitySelect = (community: HiveCommunity) => {
    discoveryCache.recordSelection('communities', community)
    refreshCachedCommunities()
  }

  const helperText =
    trimmedQuery.length === 0 && cachedCommunities.results.length > 0
      ? m.communities_recent_help()
      : trimmedQuery.length > 1
        ? m.communities_cached_help({ query: trimmedQuery })
        : m.communities_min_chars()

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Heading size="lg" mb={2}>
          {m.communities_heading()}
        </Heading>
        <Text color="fg.muted">{m.communities_description()}</Text>
      </Box>

      <SearchPanel
        label={m.communities_search_label()}
        placeholder={m.communities_search_placeholder()}
        value={query}
        onChange={setQuery}
        onSearch={() => setDebouncedQuery(query.trim())}
        buttonLabel={m.communities_search_button()}
        helperText={helperText}
        isLoading={communitiesQuery.isFetching}
        isDisabled={query.trim().length < 2}
      />

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {communitiesQuery.isFetching && results.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`community-skeleton-${index}`}
                height="240px"
                borderRadius="16px"
              />
            ))
          : results.map((community) => {
              const communityId = getCommunityIdentifier(community)
              return (
                <CommunityCard
                  key={community.id || community.name}
                  community={community}
                  profile={
                    communityId ? profilesByName.get(communityId) : undefined
                  }
                  onSelect={handleCommunitySelect}
                />
              )
            })}
      </SimpleGrid>

      {!communitiesQuery.isFetching &&
        debouncedQuery.length > 1 &&
        results.length === 0 && (
          <Text color="fg.muted">{m.communities_empty()}</Text>
        )}

      {communitiesQuery.isError && (
        <Text color="fg.error">{m.communities_error()}</Text>
      )}

      <DevOnly
        summary="Communities debug"
        json={{ query, debouncedQuery, resultsCount: results.length }}
      />
    </Stack>
  )
}
