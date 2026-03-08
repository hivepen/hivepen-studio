import { createFileRoute } from '@tanstack/react-router'
import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import { openConnectAccountDialog } from '@/lib/ui/connectAccountDialog'
import { m } from '@/paraglide/messages'
import type { SearchResult } from '@/lib/hive/search'

export const Route = createFileRoute('/blog')({
  component: MyBlogPage,
})

function MyBlogPage() {
  const [account] = useLocalStorageState<string | null>('hivepen.account', null)
  const postsQuery = useInfinitePostsQuery({
    source: 'account',
    sort: 'posts',
    author: account ?? undefined,
    limit: 20,
  })
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const [localStats, setLocalStats] = useState<
    Record<string, { votes?: number; comments?: number }>
  >({})

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !postsQuery.hasNextPage) return
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
      { rootMargin: '200px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    postsQuery.fetchNextPage,
    postsQuery.hasNextPage,
    postsQuery.isFetchingNextPage,
  ])

  const posts = useMemo(
    () => {
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
    },
    [postsQuery.data?.pages, localStats]
  )

  if (!account) {
    return (
      <Stack gap={4} p={6}>
        <Heading size="lg">{m.blog_heading()}</Heading>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          bg="bg.panel"
          p={{ base: 4, md: 6 }}
        >
          <Text color="fg.muted" mb={3}>
            {m.blog_connect_hint()}
          </Text>
          <Button
            variant="outline"
            colorPalette="gray"
            onClick={openConnectAccountDialog}
          >
            {m.blog_connect_button()}
          </Button>
        </Box>
      </Stack>
    )
  }

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Heading size="lg">{m.blog_heading()}</Heading>
        <Text color="fg.muted" mt={2}>
          {m.blog_showing_posts({ account })}
        </Text>
      </Box>
      <InfiniteDebugBanner
        pages={postsQuery.data?.pages?.length ?? 0}
        totalPosts={posts.length}
        hasNextPage={postsQuery.hasNextPage}
        isFetchingNextPage={postsQuery.isFetchingNextPage}
        lastPost={
          posts.length > 0
            ? {
                author: posts[posts.length - 1].author,
                permlink: posts[posts.length - 1].permlink,
              }
            : undefined
        }
      />

      <PostsListSection
        posts={posts}
        loading={postsQuery.isLoading}
        emptyMessage={m.blog_empty_posts()}
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
      <Box ref={loadMoreRef} minH="1px" />
      {postsQuery.hasNextPage ? (
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
      {postsQuery.isError && (
        <Text color="fg.error">{m.blog_error()}</Text>
      )}

      <DevOnly
        summary="Blog debug"
        json={{
          account,
          postsCount: posts.length,
          postsPreview: posts.slice(0, 5),
          isFetching: postsQuery.isFetching,
          isFetchingNextPage: postsQuery.isFetchingNextPage,
          hasNextPage: postsQuery.hasNextPage,
          isError: postsQuery.isError,
          localStats,
        }}
      />
    </Stack>
  )
}
