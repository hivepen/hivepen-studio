import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Card,
  Skeleton,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { searchAccounts } from '@/lib/hive/account'
import { Field } from '@/components/ui/field'
import DevOnly from '@/components/DevOnly'

export const Route = createFileRoute('/users')({
  component: Users,
})

function Users() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(handle)
  }, [query])

  const usersQuery = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => searchAccounts(debouncedQuery, 20),
    enabled: debouncedQuery.length > 1,
    staleTime: 5 * 60 * 1000,
  })

  const results = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Heading size="lg" mb={2}>
          Users
        </Heading>
        <Text color="fg.muted">
          Find Hive accounts and jump to their profiles.
        </Text>
      </Box>

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="16px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={4}>
          <Field label="Search Hive accounts">
            <Input
              placeholder="Search by username"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              bg="bg.panel"
              borderColor="border"
            />
          </Field>
          <HStack justify="space-between" wrap="wrap" gap={3}>
            <Button
              colorPalette="gray"
              onClick={() => setDebouncedQuery(query.trim())}
              loading={usersQuery.isFetching}
              disabled={query.trim().length < 2}
            >
              Search
            </Button>
            <Text fontSize="sm" color="fg.muted">
              {debouncedQuery.length > 1
                ? `Searching for "${debouncedQuery}"`
                : 'Type at least 2 characters.'}
            </Text>
          </HStack>
        </Stack>
      </Box>

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
                            @{user.name}
                          </Text>
                        </Link>
                        <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                          {user.full_name || 'Hive account'}
                        </Text>
                      </Stack>
                      <Button asChild size="sm" variant="outline" colorPalette="gray">
                        <Link
                          to="/profile/$accountname"
                          params={{ accountname: user.name }}
                        >
                          View
                        </Link>
                      </Button>
                    </HStack>
                    {user.about ? (
                      <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                        {user.about}
                      </Text>
                    ) : null}
                    <Text fontSize="xs" color="fg.muted">
                      Reputation: {user.reputation}
                    </Text>
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
      </SimpleGrid>

      {!usersQuery.isFetching && debouncedQuery.length > 1 && results.length === 0 && (
        <Text color="fg.muted">No users found.</Text>
      )}

      {usersQuery.isError && (
        <Text color="fg.error">Failed to load users.</Text>
      )}

      <DevOnly
        summary="Users debug"
        json={{ query, debouncedQuery, resultsCount: results.length }}
      />
    </Stack>
  )
}
