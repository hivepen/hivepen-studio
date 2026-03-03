import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { listCommunities } from '@/lib/hive/client'
import { Field } from '@/components/ui/field'
import DevOnly from '@/components/DevOnly'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'

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

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="16px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={4}>
          <Field label={m.communities_search_label()}>
            <Input
              placeholder={m.communities_search_placeholder()}
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
              loading={communitiesQuery.isFetching}
              disabled={query.trim().length < 2}
            >
              {m.communities_search_button()}
            </Button>
            <Text fontSize="sm" color="fg.muted">
              {debouncedQuery.length > 1
                ? m.communities_searching({ query: debouncedQuery })
                : m.communities_min_chars()}
            </Text>
          </HStack>
        </Stack>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {communitiesQuery.isFetching
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card.Root key={`community-skeleton-${index}`} variant="outline">
                <Card.Body>
                  <Stack gap={3}>
                    <HStack gap={3} align="center">
                      <Stack gap={2} flex="1">
                        <Skeleton height="14px" width="60%" />
                        <Skeleton height="10px" width="80%" />
                      </Stack>
                      <Skeleton height="28px" width="64px" borderRadius="8px" />
                    </HStack>
                    <Skeleton height="10px" width="90%" />
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))
          : results.map((community) => {
              const communityId = community.name || community.id
              return (
                <Card.Root
                  key={community.id || community.name}
                  variant="outline"
                >
                  <Card.Body>
                    <Stack gap={3}>
                      <HStack gap={3} align="center" justify="space-between">
                        <Stack gap={1} flex="1" minW={0}>
                          <Link
                            to="/communities/$communityId"
                            params={{ communityId }}
                            style={{ textDecoration: 'none' }}
                          >
                            <Text fontWeight="600" lineClamp={1}>
                              {community.title || community.name || community.id}
                            </Text>
                          </Link>
                          {communityId ? (
                            <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                              #{communityId}
                            </Text>
                          ) : null}
                        </Stack>
                        {communityId ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            colorPalette="gray"
                          >
                            <Link
                              to="/communities/$communityId"
                              params={{ communityId }}
                            >
                              {m.communities_view_button()}
                            </Link>
                          </Button>
                        ) : null}
                      </HStack>
                      {community.about ? (
                        <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                          {community.about}
                        </Text>
                      ) : null}
                    </Stack>
                  </Card.Body>
                </Card.Root>
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
