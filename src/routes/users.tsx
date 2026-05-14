import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Button,
  Card,
  HStack,
  Heading,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { HiveAccountSearchResult } from '@/lib/hive/account'
import { Avatar } from '@/components/ui/avatar'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { searchAccounts } from '@/lib/hive/account'
import DevOnly from '@/components/DevOnly'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import SearchPanel from '@/components/SearchPanel'
import { discoveryCache } from '@/features/discovery-cache'
import useDiscoverySnapshot from '@/features/discovery-cache/useDiscoverySnapshot'

export const Route = createFileRoute('/users')({
  component: Users,
})

function Users() {
  const [query, setQuery, queryReady] = useLocalStorageState(
    'hivepen.users.query',
    '',
  )
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const trimmedQuery = query.trim()
  const { snapshot: cachedUsers, refresh: refreshCachedUsers } =
    useDiscoverySnapshot('accounts', trimmedQuery, trimmedQuery ? 20 : 8)

  useEffect(() => {
    if (!queryReady) return
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(handle)
  }, [query, queryReady])

  const usersQuery = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchAccounts(debouncedQuery, 20),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  useEffect(() => {
    if (!usersQuery.data || debouncedQuery.length < 2) return
    discoveryCache.cacheSearchResults(
      'accounts',
      debouncedQuery,
      usersQuery.data,
    )
    refreshCachedUsers()
  }, [debouncedQuery, refreshCachedUsers, usersQuery.data])

  const results = useMemo(() => {
    if (trimmedQuery === debouncedQuery && usersQuery.data !== undefined) {
      return usersQuery.data
    }
    return cachedUsers.results
  }, [cachedUsers.results, debouncedQuery, trimmedQuery, usersQuery.data])

  const handleUserSelect = (user: HiveAccountSearchResult) => {
    discoveryCache.recordSelection('accounts', user)
    refreshCachedUsers()
  }

  return (
    <Stack gap={6} p={6}>
      <Wrap align="end" justify="space-between" gap={4}>
        <WrapItem flex="1" minW={{ base: '100%', md: '320px' }}>
          <Box>
            <Heading size="lg" mb={2}>
              {m.users_heading()}
            </Heading>
            <Text color="fg.muted">{m.users_subtitle()}</Text>
          </Box>
        </WrapItem>
        <WrapItem flex="1" minW={{ base: '100%', md: '320px' }}>
          <SearchPanel
            placeholder={m.users_placeholder()}
            value={query}
            onChange={setQuery}
            onSearch={() => setDebouncedQuery(query.trim())}
            searchAriaLabel={m.users_search_button()}
            isLoading={usersQuery.isFetching}
            isDisabled={query.trim().length < 2}
          />
        </WrapItem>
      </Wrap>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {usersQuery.isFetching && results.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card.Root key={`user-skeleton-${index}`} variant="outline">
                <Card.Body>
                  <Stack gap={3}>
                    <HStack gap={3}>
                      <Skeleton boxSize="40px" borderRadius="full" />
                      <Stack gap={2} flex="1">
                        <Skeleton height="12px" width="60%" />
                        <Skeleton height="10px" width="80%" />
                      </Stack>
                    </HStack>
                    <Skeleton height="10px" width="90%" />
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))
          : results.map((user) => (
              <Card.Root key={user.name} variant="outline">
                <Card.Body>
                  <Stack gap={3}>
                    <HStack gap={3} align="center">
                      <Avatar
                        name={user.name}
                        src={getHiveAvatarUrl(user.name)}
                      />
                      <Stack gap={1} flex="1" minW={0}>
                        <Link
                          to="/$accountname"
                          params={{ accountname: `@${user.name}` }}
                          onClick={() => handleUserSelect(user)}
                          style={{ textDecoration: 'none' }}
                        >
                          <Text fontWeight="600" lineClamp={1}>
                            {user.full_name || m.users_default_name()}
                          </Text>
                        </Link>
                        <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                          @{user.name}
                        </Text>
                      </Stack>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        colorPalette="gray"
                      >
                        <Link
                          to="/$accountname"
                          params={{ accountname: `@${user.name}` }}
                          onClick={() => handleUserSelect(user)}
                        >
                          {m.users_view_button()}
                        </Link>
                      </Button>
                    </HStack>
                    {user.about ? (
                      <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                        {user.about}
                      </Text>
                    ) : null}
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
      </SimpleGrid>

      {!usersQuery.isFetching &&
        debouncedQuery.length > 1 &&
        results.length === 0 && <Text color="fg.muted">{m.users_empty()}</Text>}

      {usersQuery.isError && <Text color="fg.error">{m.users_error()}</Text>}

      <DevOnly
        summary="Users debug"
        json={{ query, debouncedQuery, resultsCount: results.length }}
      />
    </Stack>
  )
}
