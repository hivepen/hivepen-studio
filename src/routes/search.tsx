import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import {
  Box,
  Button,
  Heading,
  Input,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  Select,
  createListCollection,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { searchAccounts } from '@/lib/hive/account'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

import CommunityCombobox from '@/components/CommunityCombobox'
import AccountCombobox from '@/components/AccountCombobox'
import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import usePostsListState from '@/features/posts/usePostsListState'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import { Field } from '@/components/ui/field'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import type { SearchResult } from '@/lib/hive/search'
import { discoveryCache } from '@/features/discovery-cache'
import useDiscoverySnapshot from '@/features/discovery-cache/useDiscoverySnapshot'

const searchSchema = z
  .object({
    sort: z.enum(['trending', 'hot', 'created', 'payout']).optional(),
    tag: z.string().optional(),
    community: z.string().optional(),
    author: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    scope: z.enum(['all', 'user']).optional(),
  })
  .default({})

export const Route = createFileRoute('/search')({
  component: Search,
  validateSearch: zodValidator(searchSchema),
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
  const locale = getLocale()
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
    searchParams.scope,
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
  const scopeFromParams = searchParams.scope === 'user' ? 'user' : 'all'
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
    if (
      stored.scope === 'user' &&
      stored.author &&
      stored.author !== username
    ) {
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
      authorOverride?: string,
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
    [navigate, scope, username],
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
      JSON.stringify(prev) === JSON.stringify(nextFilters) ? prev : nextFilters,
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
  const [authorInput, setAuthorInput] = useState(
    scope === 'user' ? username : filters.author,
  )
  const [debouncedAuthor, setDebouncedAuthor] = useState(authorInput)
  useEffect(() => {
    setAuthorInput(scope === 'user' ? username : filters.author)
  }, [scope, username, filters.author])
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedAuthor(authorInput.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [authorInput])
  useEffect(() => {
    if (scope === 'user') {
      if (debouncedAuthor === username) return
      setUsername(debouncedAuthor)
      syncQueryParams(filters, 'user', debouncedAuthor)
      return
    }
    if (debouncedAuthor === filters.author) return
    setFilters((prev) => {
      const next = { ...prev, author: debouncedAuthor }
      syncQueryParams(next, scope)
      return next
    })
  }, [debouncedAuthor, scope, username, filters, setUsername, syncQueryParams])
  const hasAuthor = Boolean(scopedAuthor)
  const canSearch = Boolean(activeTag) || hasAuthor
  const {
    snapshot: cachedAuthorSuggestions,
    refresh: refreshCachedAuthorSuggestions,
  } = useDiscoverySnapshot(
    'accounts',
    authorInput.trim(),
    authorInput.trim() ? 6 : 5,
  )
  const {
    snapshot: featuredAuthorSuggestions,
    refresh: refreshFeaturedAuthorSuggestions,
  } = useDiscoverySnapshot('accounts', '', 8)

  const postsQuery = useInfinitePostsQuery({
    source: hasAuthor ? 'account' : 'ranked',
    sort: filters.sort,
    tag: activeTag,
    author: scopedAuthor,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: 20,
  })

  const authorSuggestionsQuery = useQuery({
    queryKey: ['users', 'suggest', debouncedAuthor],
    queryFn: () => searchAccounts(debouncedAuthor, 6),
    enabled: debouncedAuthor.length > 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  useEffect(() => {
    if (!authorSuggestionsQuery.data || debouncedAuthor.length < 2) return
    discoveryCache.cacheSearchResults(
      'accounts',
      debouncedAuthor,
      authorSuggestionsQuery.data,
    )
    refreshCachedAuthorSuggestions()
  }, [
    authorSuggestionsQuery.data,
    debouncedAuthor,
    refreshCachedAuthorSuggestions,
  ])

  const authorSuggestions =
    authorInput.trim() === debouncedAuthor &&
    authorSuggestionsQuery.data !== undefined
      ? authorSuggestionsQuery.data
      : cachedAuthorSuggestions.results

  const [localStats, setLocalStats] = useState<
    Record<string, { votes?: number; comments?: number }>
  >({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !postsQuery.hasNextPage || !canSearch) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          postsQuery.hasNextPage &&
          !postsQuery.isFetchingNextPage
        ) {
          postsQuery.fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    canSearch,
    postsQuery.fetchNextPage,
    postsQuery.hasNextPage,
    postsQuery.isFetchingNextPage,
  ])

  const sortCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: m.search_sort_trending(), value: 'trending' },
          { label: m.search_sort_hot(), value: 'hot' },
          { label: m.search_sort_newest(), value: 'created' },
          { label: m.search_sort_payout(), value: 'payout' },
        ],
      }),
    [locale],
  )

  const cardResults = useMemo(() => {
    const pages = (postsQuery.data?.pages ?? []) as SearchResult[][]
    const flattened = pages.flat()
    const unique = new Map<string, SearchResult>()
    flattened.forEach((post) => {
      const key = `${post.author}/${post.permlink}`
      if (!unique.has(key)) {
        unique.set(key, post)
      }
    })

    return Array.from(unique.values()).map((post) => {
      const key = `${post.author}/${post.permlink}`
      const overrides = localStats[key] ?? {}
      return {
        title: post.title || m.post_untitled(),
        author: post.author,
        community: post.communityTitle ?? post.community,
        communityId: post.community,
        tags: post.tags,
        summary: post.summary,
        coverUrl: post.coverUrl,
        app: post.app,
        createdAt: new Date(post.created).toLocaleDateString(),
        permlink: post.permlink,
        votes: overrides.votes ?? post.votes,
        comments: overrides.comments ?? post.comments,
        payout: post.payout,
      }
    })
  }, [postsQuery.data?.pages, localStats])

  return (
    <Stack
      gap={{ base: 5, md: 6 }}
      maxW="7xl"
      mx="auto"
      p={{ base: 4, md: 6 }}
      w="full"
    >
      <Heading size="lg">{m.search_heading()}</Heading>
      <InfiniteDebugBanner
        pages={postsQuery.data?.pages?.length ?? 0}
        totalPosts={cardResults.length}
        hasNextPage={postsQuery.hasNextPage}
        isFetchingNextPage={postsQuery.isFetchingNextPage}
        lastPost={
          cardResults.length > 0
            ? {
                author: cardResults[cardResults.length - 1].author,
                permlink: cardResults[cardResults.length - 1].permlink,
              }
            : undefined
        }
      />

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="12px"
        bg="bg.panel"
        p={{ base: 4, md: 5 }}
      >
        <Stack gap={4}>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', lg: 'center' }}
            gap={3}
          >
            <HStack wrap="wrap" gap={2}>
              <Button
                size="sm"
                flex={{ base: 1, sm: 'initial' }}
                minW={{ sm: '120px' }}
                variant={scope === 'all' ? 'solid' : 'outline'}
                colorPalette="gray"
                onClick={() => {
                  setScope('all')
                  syncQueryParams({ ...filters, author: '' }, 'all', '')
                }}
              >
                {m.search_scope_all()}
              </Button>
              <Button
                size="sm"
                flex={{ base: 1, sm: 'initial' }}
                minW={{ sm: '120px' }}
                variant={scope === 'user' ? 'solid' : 'outline'}
                colorPalette="gray"
                onClick={() => {
                  setScope('user')
                  syncQueryParams(filters, 'user', username)
                }}
              >
                {m.search_scope_user()}
              </Button>
            </HStack>
            <Box w={{ base: 'full', sm: '220px' }}>
              <Select.Root
                collection={sortCollection}
                value={[filters.sort]}
                onValueChange={(details) => {
                  const value = details.value[0] as
                    | SearchFilters['sort']
                    | undefined
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
                  <Select.Trigger w="full" bg="bg" borderColor="border">
                    <Select.ValueText
                      placeholder={m.search_sort_placeholder()}
                    />
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Trigger>
                </Select.Control>
                <Select.Positioner>
                  <Select.Content bg="bg.panel">
                    {sortCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        <Select.ItemText>{item.label}</Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            </Box>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
            <CommunityCombobox
              size="sm"
              value={filters.community}
              onChange={(value) =>
                setFilters((prev) => {
                  const next = { ...prev, community: value }
                  syncQueryParams(next, scope)
                  return next
                })
              }
            />
            <Field label={m.search_tag_label()} required={!filters.community}>
              <Input
                placeholder={m.search_tag_placeholder()}
                value={filters.tag}
                onChange={(event) =>
                  setFilters((prev) => {
                    const next = { ...prev, tag: event.target.value }
                    syncQueryParams(next, scope)
                    return next
                  })
                }
                bg="bg"
                borderColor="border"
              />
            </Field>
            <Box gridColumn={{ base: 'auto', md: '1 / -1', xl: 'auto' }}>
              <Field label={m.search_author_label()}>
                <AccountCombobox
                  emptyText={m.search_author_no_users()}
                  featuredSuggestions={featuredAuthorSuggestions.results}
                  loading={authorSuggestionsQuery.isFetching}
                  onChange={setAuthorInput}
                  onSuggestionSelect={(user) => {
                    discoveryCache.recordSelection('accounts', user)
                    refreshCachedAuthorSuggestions()
                    refreshFeaturedAuthorSuggestions()
                  }}
                  placeholder={m.search_author_placeholder()}
                  recentText={m.users_recent_help()}
                  searchingText={m.search_author_searching()}
                  size="sm"
                  suggestions={authorSuggestions}
                  value={authorInput}
                />
              </Field>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Field label={m.search_from_label()}>
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
                bg="bg"
                borderColor="border"
              />
            </Field>
            <Field label={m.search_to_label()}>
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
                bg="bg"
                borderColor="border"
              />
            </Field>
          </SimpleGrid>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
            gap={3}
          >
            <Stack direction={{ base: 'column', sm: 'row' }} gap={2}>
              <Button
                colorPalette="gray"
                onClick={() => postsQuery.refetch()}
                loading={postsQuery.isFetching}
                disabled={!canSearch}
              >
                {m.search_run()}
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
                {m.search_clear()}
              </Button>
            </Stack>
            {activeTag || hasAuthor ? (
              <Text fontSize="sm" color="fg.muted">
                {`${m.search_status_searching()}${activeTag ? ` ${m.search_status_by_tag({ tag: activeTag })}` : ''}${hasAuthor ? ` ${m.search_status_for_author({ author: scopedAuthor ?? '' })}` : ''}`}
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <PostsListSection
        posts={cardResults}
        loading={postsQuery.isLoading}
        emptyMessage={
          activeTag || hasAuthor
            ? m.search_empty_no_results()
            : m.search_status_select_prompt()
        }
        renderActions={(post) =>
          post.permlink ? (
            <PostActions
              author={post.author}
              permlink={post.permlink}
              voteCount={post.votes}
              commentCount={post.comments}
              variant="card"
              onVoteSuccess={() =>
                setLocalStats((prev) => {
                  const key = `${post.author}/${post.permlink}`
                  const current = prev[key]?.votes ?? post.votes ?? 0
                  return {
                    ...prev,
                    [key]: { ...prev[key], votes: current + 1 },
                  }
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
      <Box ref={loadMoreRef} minH="1px" />
      {postsQuery.hasNextPage && canSearch ? (
        <Button
          alignSelf="center"
          variant="outline"
          colorPalette="gray"
          loading={postsQuery.isFetchingNextPage}
          loadingText={m.posts_loading_more()}
          onClick={() => postsQuery.fetchNextPage()}
        >
          {m.posts_load_more()}
        </Button>
      ) : null}
      {postsQuery.isError && <Text color="fg.error">{m.search_error()}</Text>}

      <DevOnly
        summary="Search debug"
        json={{ filters, routeSearch: searchParams, scope, username }}
      />
    </Stack>
  )
}
