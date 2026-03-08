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
import { listCommunities } from '@/lib/hive/client'
import DevOnly from '@/components/DevOnly'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import SearchPanel from '@/components/SearchPanel'
import CommunityCard from '@/components/CommunityCard'
import useProfilesQuery from '@/features/profile/useProfilesQuery'
import { type AccountProfile } from '@/features/profile/profileTypes'

export const Route = createFileRoute('/communities')({
  component: Communities,
})

function Communities() {
  const [query, setQuery, queryReady] = useLocalStorageState(
    'hivepen.communities.query',
    ''
  )
  const [debouncedQuery, setDebouncedQuery] = useState('')

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

  const results = useMemo(() => communitiesQuery.data ?? [], [communitiesQuery.data])
  const communityIds = useMemo(
    () =>
      results
        .map((community) => (community.name || community.id || '').trim())
        .filter(Boolean),
    [results]
  )
  const profilesQuery = useProfilesQuery(communityIds)
  const profilesByName = useMemo(() => {
    const map = new Map<string, AccountProfile>()
    profilesQuery.data?.forEach((profile) => {
      map.set(profile.name, profile)
    })
    return map
  }, [profilesQuery.data])

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Heading size="lg" mb={2}>
          {m.communities_heading()}
        </Heading>
        <Text color="fg.muted">
          {m.communities_description()}
        </Text>
      </Box>

      <SearchPanel
        label={m.communities_search_label()}
        placeholder={m.communities_search_placeholder()}
        value={query}
        onChange={setQuery}
        onSearch={() => setDebouncedQuery(query.trim())}
        buttonLabel={m.communities_search_button()}
        helperText={
          debouncedQuery.length > 1
            ? m.communities_searching({ query: debouncedQuery })
            : m.communities_min_chars()
        }
        isLoading={communitiesQuery.isFetching}
        isDisabled={query.trim().length < 2}
      />

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {communitiesQuery.isFetching
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={`community-skeleton-${index}`}
                height="240px"
                borderRadius="16px"
              />
            ))
          : results.map((community) => {
              const communityId = community.name || community.id
              return (
                <CommunityCard
                  key={community.id || community.name}
                  community={community}
                  profile={communityId ? profilesByName.get(communityId) : undefined}
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
