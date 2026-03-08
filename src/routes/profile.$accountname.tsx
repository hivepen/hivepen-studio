import { createFileRoute } from '@tanstack/react-router'
import { Box, Button, Group, Heading, HStack, IconButton, Stack, Text } from '@chakra-ui/react'
import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import useProfileQuery from '@/features/profile/useProfileQuery'
import { useEffect, useMemo, useRef, useState } from 'react'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import { m } from '@/paraglide/messages'
import type { SearchResult } from '@/lib/hive/search'
import ProfileBanner from '@/components/ProfileBanner'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { MessageSquareIcon } from 'lucide-react'

export const Route = createFileRoute('/profile/$accountname')({
  component: ProfilePage,
})

function ProfilePage() {
  const { accountname } = Route.useParams()
  const username = accountname.replace(/^@/, '')

  const profileQuery = useProfileQuery(username)
  const postsQuery = useInfinitePostsQuery({
    source: 'account',
    sort: 'posts',
    author: username,
    limit: 20,
  })
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const [localStats, setLocalStats] = useState<Record<string, { votes?: number; comments?: number }>>({})

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
    [postsQuery.data, localStats]
  )

  const profileMeta = (
    <HStack gap={4} mt={1} color="fg.muted" fontSize="sm" wrap="wrap">
      {profileQuery.data?.postCount !== undefined ? (
        <Text>
          {m.profile_posts_count({ count: profileQuery.data.postCount })}
        </Text>
      ) : null}
      {profileQuery.data?.followerCount !== undefined ? (
        <Text>
          {m.profile_followers({ count: profileQuery.data.followerCount })}
        </Text>
      ) : null}
      {profileQuery.data?.followingCount !== undefined ? (
        <Text>
          {m.profile_following({ count: profileQuery.data.followingCount })}
        </Text>
      ) : null}
    </HStack>
  )

  return (
    <Stack gap={6} p={6}>
      <ProfileBanner
        title={profileQuery.data?.displayName || `@${username}`}
        subtitle={profileQuery.data?.displayName ? `@${username}` : undefined}
        description={profileQuery.data?.about ?? m.profile_fallback_about()}
        avatarName={username}
        avatarUrl={profileQuery.data?.profileImage ?? getHiveAvatarUrl(username)}
        coverUrl={profileQuery.data?.coverImage}
        actions={
          <Group gap={2} bg="white" rounded="md" p={1}>
            <Button variant="ghost">{m.profile_follow_button()}</Button>
            <IconButton variant="ghost" title={m.profile_message_button()}><MessageSquareIcon/></IconButton>
          </Group>
        }
        meta={profileMeta}
      />

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

      <Box>
        <Heading size="md" mb={3}>
          {m.profile_posts_heading()}
        </Heading>
        <PostsListSection
          posts={posts}
          loading={postsQuery.isLoading}
          emptyMessage={m.profile_empty_posts()}
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
      </Box>

      <DevOnly
        summary="Profile debug"
        json={{
          accountname,
          username,
          profile: profileQuery.data,
          postsCount: posts.length,
          postsPreview: posts.slice(0, 5),
          isFetching: postsQuery.isFetching,
          isError: postsQuery.isError,
          localStats,
        }}
      />
    </Stack>
  )
}
