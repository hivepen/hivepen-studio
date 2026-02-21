import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Select,
  createListCollection,
} from '@chakra-ui/react'
import { useMemo, useState, useEffect, useCallback, useRef } from 'react'

import CommunityCombobox from '@/components/CommunityCombobox'
import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import usePostsListState from '@/features/posts/usePostsListState'
import usePostsQuery from '@/features/posts/usePostsQuery'
import { Field } from '@/components/ui/field'
import DevOnly from '@/components/DevOnly'

export const Route = createFileRoute('/search')({
  component: Search,
  validateSearch: (search: Record<string, unknown>) => ({
    sort: typeof search.sort === 'string' ? search.sort : undefined,
    tag: typeof search.tag === 'string' ? search.tag : undefined,
    community: typeof search.community === 'string' ? search.community : undefined,
    author: typeof search.author === 'string' ? search.author : undefined,
    dateFrom: typeof search.dateFrom === 'string' ? search.dateFrom : undefined,
    dateTo: typeof search.dateTo === 'string' ? search.dateTo : undefined,
    scope: typeof search.scope === 'string' ? search.scope : undefined,
  }),
})

type SearchFilters = {
  sort: 'trending' | 'hot' | 'created' | 'payout'
  tag: string
  community: string
  author: string
  dateFrom: string
  dateTo: string
}

type StoredSearchState = SearchFilters & {
  scope?: 'all' | 'user'
}

const STORAGE_KEY = 'hivepen.search.filters'

const defaultFilters: SearchFilters = {
  sort: 'trending',
  tag: '',
  community: '',
  author: '',
  dateFrom: '',
  dateTo: '',
}

const readStoredState = (): StoredSearchState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSearchState
    return parsed
  } catch {
    return null
  }
}

function Search() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const { scope, setScope, username, setUsername } = usePostsListState()
  const readyRef = useRef(false)
  const storedRef = useRef<StoredSearchState | null>(null)
  if (storedRef.current === null && typeof window !== 'undefined') {
    storedRef.current = readStoredState()
  }

  const hasQueryParams = Boolean(
    searchParams.sort ||
      searchParams.tag ||
      searchParams.community ||
      searchParams.author ||
      searchParams.dateFrom ||
      searchParams.dateTo ||
      searchParams.scope
  )

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const fromQuery: SearchFilters = {
      sort:
        (searchParams.sort as SearchFilters['sort'] | undefined) ??
        defaultFilters.sort,
      tag: (searchParams.tag as string | undefined) ?? '',
      community: (searchParams.community as string | undefined) ?? '',
      author: (searchParams.author as string | undefined) ?? '',
      dateFrom: (searchParams.dateFrom as string | undefined) ?? '',
      dateTo: (searchParams.dateTo as string | undefined) ?? '',
    }
    if (hasQueryParams) {
      return { ...defaultFilters, ...fromQuery }
    }
    if (storedRef.current) {
      return { ...defaultFilters, ...storedRef.current }
    }
    return { ...defaultFilters }
  })
  const scopeFromParams =
    searchParams.scope === 'user' ? 'user' : 'all'
  useEffect(() => {
    if (hasQueryParams) {
      if (scopeFromParams !== scope) {
        setScope(scopeFromParams)
      }
      if (
        scopeFromParams === 'user' &&
        searchParams.author &&
        username !== searchParams.author
      ) {
        setUsername(searchParams.author as string)
      }
      return
    }
    const stored = storedRef.current
    if (!stored) return
    if (stored.scope && stored.scope !== scope) {
      setScope(stored.scope)
    }
    if (stored.scope === 'user' && stored.author && stored.author !== username) {
      setUsername(stored.author)
    }
  }, [
    hasQueryParams,
    scopeFromParams,
    scope,
    searchParams.author,
    username,
    setScope,
    setUsername,
  ])

  const syncQueryParams = useCallback(
    (
      nextFilters: SearchFilters,
      nextScope: typeof scope = scope,
      authorOverride?: string
    ) => {
      if (!readyRef.current) {
        return
      }
      const effectiveAuthor =
        nextScope === 'user'
          ? authorOverride?.trim() || username.trim() || undefined
          : nextFilters.author.trim() || undefined
      navigate({
        replace: true,
        search: {
          sort: nextFilters.sort,
          tag: nextFilters.tag || undefined,
          community: nextFilters.community || undefined,
          author: effectiveAuthor,
          dateFrom: nextFilters.dateFrom || undefined,
          dateTo: nextFilters.dateTo || undefined,
          scope: nextScope,
        },
      })
    },
    [navigate, scope, username]
  )

  useEffect(() => {
    if (!hasQueryParams) return
    const nextFilters: SearchFilters = {
      sort:
        (searchParams.sort as SearchFilters['sort'] | undefined) ?? 'trending',
      tag: (searchParams.tag as string | undefined) ?? '',
      community: (searchParams.community as string | undefined) ?? '',
      author: (searchParams.author as string | undefined) ?? '',
      dateFrom: (searchParams.dateFrom as string | undefined) ?? '',
      dateTo: (searchParams.dateTo as string | undefined) ?? '',
    }
    setFilters((prev) =>
      JSON.stringify(prev) === JSON.stringify(nextFilters) ? prev : nextFilters
    )
  }, [
    hasQueryParams,
    searchParams.sort,
    searchParams.tag,
    searchParams.community,
    searchParams.author,
    searchParams.dateFrom,
    searchParams.dateTo,
  ])

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const payload: StoredSearchState = {
      ...filters,
      scope,
      author: scope === 'user' ? username : filters.author,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [filters, scope, username])
  const activeTag = filters.community.trim() || filters.tag.trim()
  const scopedAuthor =
    scope === 'user' && username.trim().length > 0
      ? username.trim()
      : filters.author.trim() || undefined

  const postsQuery = usePostsQuery({
    sort: filters.sort,
    tag: activeTag,
    author: scopedAuthor,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: 20,
  })


  const [localStats, setLocalStats] = useState<Record<string, { votes?: number; comments?: number }>>({})

  const sortCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: 'Trending', value: 'trending' },
          { label: 'Hot', value: 'hot' },
          { label: 'Newest', value: 'created' },
          { label: 'Top payout', value: 'payout' },
        ],
      }),
    []
  )

  const cardResults = useMemo(() => {
    return (postsQuery.data ?? []).map((post) => {
      const key = `${post.author}/${post.permlink}`
      const overrides = localStats[key] ?? {}
      return {
        title: post.title || '(Untitled)',
        author: post.author,
        community: post.communityTitle ?? post.community,
        communityId: post.community,
        tags: post.tags,
        summary: post.summary,
        coverUrl: post.coverUrl,
        createdAt: new Date(post.created).toLocaleDateString(),
        permlink: post.permlink,
        votes: overrides.votes ?? post.votes,
        comments: overrides.comments ?? post.comments,
      }
    })
  }, [postsQuery.data, localStats])

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Badge colorPalette="purple" variant="subtle" mb={2}>
          Global Search
        </Badge>
        <Heading size="lg">Search posts across Hive</Heading>
        <Text color="fg.muted" mt={2} maxW="720px">
          Filter by tags, community, author, and date range. The search uses the
          Hive bridge ranked posts endpoint and refines results locally.
        </Text>
      </Box>

      <Stack gap={4}>
        <Stack gap={2}>
          <Text fontSize="sm" color="fg.muted">
            Scope
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
            <Button
              variant={scope === 'all' ? 'solid' : 'outline'}
              colorPalette="gray"
              onClick={() => {
                setScope('all')
                syncQueryParams({ ...filters, author: '' }, 'all', '')
              }}
            >
              All posts
            </Button>
            <Button
              variant={scope === 'user' ? 'solid' : 'outline'}
              colorPalette="gray"
              onClick={() => {
                setScope('user')
                syncQueryParams(filters, 'user', username)
              }}
            >
              User posts
            </Button>
          </Stack>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <CommunityCombobox
            value={filters.community}
            onChange={(value) =>
              setFilters((prev) => {
                const next = { ...prev, community: value }
                syncQueryParams(next, scope)
                return next
              })
            }
          />
          <Field label="Tag" helperText="Optional if community selected" required={!filters.community}>
            <Input
              placeholder="spanish, photography, etc."
              value={filters.tag}
              onChange={(event) =>
                setFilters((prev) => {
                  const next = { ...prev, tag: event.target.value }
                  syncQueryParams(next, scope)
                  return next
                })
              }
              bg="bg.panel"
              borderColor="border"
            />
          </Field>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Input
              placeholder="Author (optional)"
              value={scope === 'user' ? username : filters.author}
              onChange={(event) =>
                scope === 'user'
                  ? (() => {
                      setUsername(event.target.value)
                      syncQueryParams(filters, 'user', event.target.value)
                    })()
                  : setFilters((prev) => {
                      const next = { ...prev, author: event.target.value }
                      syncQueryParams(next, scope)
                      return next
                    })
              }
            bg="bg.panel"
            borderColor="border"
          />
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              setFilters((prev) => {
                const next = { ...prev, dateFrom: event.target.value }
                syncQueryParams(next, scope)
                return next
              })
            }
            bg="bg.panel"
            borderColor="border"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              setFilters((prev) => {
                const next = { ...prev, dateTo: event.target.value }
                syncQueryParams(next, scope)
                return next
              })
            }
            bg="bg.panel"
            borderColor="border"
          />
        </SimpleGrid>

        <Stack direction={{ base: 'column', md: 'row' }} gap={3} align="center">
          <Select.Root
            collection={sortCollection}
            value={[filters.sort]}
            onValueChange={(details) => {
              const value = details.value[0] as SearchFilters['sort'] | undefined
              if (!value) return
              setFilters((prev) => {
                const next = { ...prev, sort: value }
                syncQueryParams(next, scope)
                return next
              })
            }}
            size="sm"
          >
            <Select.Control>
              <Select.Trigger maxW="220px" bg="bg.panel" borderColor="border">
                <Select.ValueText placeholder="Sort posts" />
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {sortCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          <Button
            colorPalette="gray"
            onClick={() => postsQuery.refetch()}
            loading={postsQuery.isFetching}
            disabled={!activeTag}
          >
            Run search
          </Button>
          <Button
            variant="outline"
            colorPalette="gray"
            onClick={() => {
              const cleared: SearchFilters = {
                sort: 'trending',
                tag: '',
                community: '',
                author: '',
                dateFrom: '',
                dateTo: '',
              }
              setFilters(cleared)
              setUsername('')
              setScope('all')
              syncQueryParams(cleared, 'all', '')
            }}
          >
            Clear filters
          </Button>
          <Text fontSize="sm" color="fg.muted">
            {activeTag
              ? `Searching by ${activeTag}`
              : 'Select a community or tag to search.'}
          </Text>
        </Stack>
      </Stack>

      <PostsListSection
        posts={cardResults}
        loading={postsQuery.isFetching}
        emptyMessage={
          activeTag
            ? 'No posts found for the current filters.'
            : 'Select a community or tag to start searching.'
        }
        renderActions={(post) =>
          post.permlink ? (
            <PostActions
              author={post.author}
              permlink={post.permlink}
              voteCount={post.votes}
              commentCount={post.comments}
              onVoteSuccess={() =>
                setLocalStats((prev) => {
                  const key = `${post.author}/${post.permlink}`
                  const current = prev[key]?.votes ?? post.votes ?? 0
                  return { ...prev, [key]: { ...prev[key], votes: current + 1 } }
                })
              }
              onCommentSuccess={() =>
                setLocalStats((prev) => {
                  const key = `${post.author}/${post.permlink}`
                  const current = prev[key]?.comments ?? post.comments ?? 0
                  return {
                    ...prev,
                    [key]: { ...prev[key], comments: current + 1 },
                  }
                })
              }
            />
          ) : null
        }
      />
      {postsQuery.isError && (
        <Text color="fg.error">Failed to load posts. Try again.</Text>
      )}

      <DevOnly
        summary="Search debug"
        json={{ filters, routeSearch: searchParams, scope, username }}
      />
    </Stack>
  )
}
