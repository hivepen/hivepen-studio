import { Link, createFileRoute } from '@tanstack/react-router'
import { Box, Button, HStack, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { PostSearchResult } from '@/lib/hive/search'
import useCommunityQuery from '@/features/communities/useCommunityQuery'
import PostsListSection from '@/features/posts/PostsListSection'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/communities/$communityId')({
  component: CommunityPage,
})

function CommunityPage() {
  const { communityId } = Route.useParams()
  const communityQuery = useCommunityQuery(communityId)
  const postsQuery = useInfinitePostsQuery({
    sort: 'created',
    tag: communityId,
    limit: 20,
  })
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    postsQuery.fetchNextPage,
    postsQuery.hasNextPage,
    postsQuery.isFetchingNextPage,
  ])

  const posts = useMemo(() => {
    const pages = (postsQuery.data?.pages ?? []) as Array<
      Array<PostSearchResult>
    >
    const flattened = pages.flat()
    const unique = new Map<string, PostSearchResult>()
    flattened.forEach((post) => {
      const key = `${post.author}/${post.permlink}`
      if (!unique.has(key)) {
        unique.set(key, post)
      }
    })

    return Array.from(unique.values()).map((post) => {
      return {
        title: post.title || m.post_untitled(),
        author: post.author,
        community: post.communityTitle ?? post.communityId,
        communityId: post.communityId,
        tags: post.tags,
        summary: post.summary,
        coverUrl: post.coverUrl,
        app: post.app,
        createdAt: new Date(post.created).toLocaleDateString(),
        permlink: post.permlink,
        votes: post.votes,
        voteDetails: post.voteDetails,
        comments: post.comments,
        payout: post.payout,
      }
    })
  }, [postsQuery.data])

  return (
    <Stack gap={6} p={6}>
      <Button asChild variant="ghost" size="sm" alignSelf="flex-start">
        <Link to="/communities">
          <HStack gap={2}>
            <ArrowLeft />
            <Text>{m.community_back()}</Text>
          </HStack>
        </Link>
      </Button>

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="16px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={3}>
          <Heading size="lg">
            {communityQuery.data?.title ?? communityId}
          </Heading>
          <Text color="fg.muted">
            {communityQuery.data?.about ??
              communityQuery.data?.description ??
              m.community_overview_fallback()}
          </Text>
          <HStack gap={4} fontSize="sm" color="fg.muted" wrap="wrap">
            {communityQuery.data?.name ? (
              <Text>#{communityQuery.data.name}</Text>
            ) : null}
            {communityQuery.data?.subscribers !== undefined ? (
              <Text>
                {m.community_members({
                  count: communityQuery.data.subscribers,
                })}
              </Text>
            ) : null}
            {communityQuery.data?.lang ? (
              <Text>{communityQuery.data.lang}</Text>
            ) : null}
            {communityQuery.data?.is_nsfw ? (
              <Text>{m.community_nsfw()}</Text>
            ) : null}
          </HStack>
        </Stack>
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
        emptyMessage={m.community_empty_posts()}
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
        <Text color="fg.error">{m.community_posts_error()}</Text>
      )}

      <DevOnly
        summary="Community debug"
        json={{
          communityId,
          community: communityQuery.data,
          postsCount: posts.length,
          postsPreview: posts.slice(0, 5),
          isFetching: postsQuery.isFetching,
          isError: postsQuery.isError,
        }}
      />
    </Stack>
  )
}
