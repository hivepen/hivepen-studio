import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  Card,
  Skeleton,
  Button
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { searchAccounts } from '@/lib/hive/account'
import DevOnly from '@/components/DevOnly'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import SearchPanel from '@/components/SearchPanel'

export const Route = createFileRoute('/users')({
  component: Users,
})

function Users() {
  const [query, setQuery, queryReady] = useLocalStorageState(
    'hivepen.users.query',
    ''
  )
  const [debouncedQuery, setDebouncedQuery] = useState('')

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

  const results = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Heading size="lg" mb={2}>
          {m.users_heading()}
        </Heading>
        <Text color="fg.muted">
          {m.users_subtitle()}
        </Text>
      </Box>

      <SearchPanel
        label={m.users_field_label()}
        placeholder={m.users_placeholder()}
        value={query}
        onChange={setQuery}
        onSearch={() => setDebouncedQuery(query.trim())}
        buttonLabel={m.users_search_button()}
        helperText={
          debouncedQuery.length > 1
            ? m.users_searching({ query: debouncedQuery })
            : m.users_min_chars()
        }
        isLoading={usersQuery.isFetching}
        isDisabled={query.trim().length < 2}
      />

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {usersQuery.isFetching
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
                          to="/profile/$accountname"
                          params={{ accountname: user.name }}
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
                      <Button asChild size="sm" variant="outline" colorPalette="gray">
                        <Link
                          to="/profile/$accountname"
                          params={{ accountname: user.name }}
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

      {!usersQuery.isFetching && debouncedQuery.length > 1 && results.length === 0 && (
        <Text color="fg.muted">{m.users_empty()}</Text>
      )}

      {usersQuery.isError && (
        <Text color="fg.error">{m.users_error()}</Text>
      )}

      <DevOnly
        summary="Users debug"
        json={{ query, debouncedQuery, resultsCount: results.length }}
      />
    </Stack>
  )
}
