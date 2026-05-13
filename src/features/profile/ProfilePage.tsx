import {
  Box,
  Button,
  Group,
  HStack,
  Heading,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import {
  InfoIcon,
  MessageSquare,
  MessageSquareIcon,
  MoreVertical,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import type { PostSearchResult } from '@/lib/hive/search'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import ProfileBanner from '@/components/ProfileBanner'
import PostsListSection from '@/features/posts/PostsListSection'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import useProfileQuery from '@/features/profile/useProfileQuery'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { m } from '@/paraglide/messages'

export default function ProfilePage({ accountname }: { accountname: string }) {
  const username = accountname.replace(/^@/, '')
  const profileQuery = useProfileQuery(username)
  const postsQuery = useInfinitePostsQuery({
    source: 'account',
    sort: 'posts',
    author: username,
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
        app: post.app,
        author: post.author,
        comments: post.comments,
        community: post.communityTitle ?? post.communityId,
        communityId: post.communityId,
        coverUrl: post.coverUrl,
        createdAt: new Date(post.created).toLocaleDateString(),
        payout: post.payout,
        permlink: post.permlink,
        summary: post.summary,
        tags: post.tags,
        title: post.title || m.post_untitled(),
        votes: post.votes,
        voteDetails: post.voteDetails,
      }
    })
  }, [postsQuery.data])

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
        actions={
          <Group bg="bg.panel" gap={2} p={1} rounded="md">
            <Button variant="ghost">{m.profile_follow_button()}</Button>
            <IconButton title={m.profile_message_button()} variant="ghost">
              <Icon as={MessageSquare} strokeWidth={2.5} />
            </IconButton>
            <IconButton asChild variant="ghost">
              <Link
                params={{ accountname: `@${username}` }}
                to="/$accountname/wallet"
              >
                <Icon as={MoreVertical} strokeWidth={2.5} />
              </Link>
            </IconButton>
          </Group>
        }
        avatarName={username}
        avatarUrl={
          profileQuery.data?.profileImage ?? getHiveAvatarUrl(username)
        }
        coverUrl={profileQuery.data?.coverImage}
        description={profileQuery.data?.about ?? m.profile_fallback_about()}
        meta={profileMeta}
        subtitle={profileQuery.data?.displayName ? `@${username}` : undefined}
        title={profileQuery.data?.displayName || `@${username}`}
      />
      <DevOnly json={profileQuery.data} />

      <InfiniteDebugBanner
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
        pages={postsQuery.data?.pages?.length ?? 0}
        totalPosts={posts.length}
      />

      <Box>
        <Heading mb={3} size="md">
          {m.profile_posts_heading()}
        </Heading>
        <PostsListSection
          emptyMessage={m.profile_empty_posts()}
          loading={postsQuery.isLoading}
          posts={posts}
        />
        <Box minH="1px" ref={loadMoreRef} />
        {postsQuery.hasNextPage ? (
          <Button
            alignSelf="center"
            colorPalette="gray"
            loading={postsQuery.isFetchingNextPage}
            loadingText={m.posts_loading_more()}
            onClick={() => postsQuery.fetchNextPage()}
            variant="outline"
          >
            {m.posts_load_more()}
          </Button>
        ) : null}
      </Box>

      <DevOnly
        json={{
          accountname,
          isError: postsQuery.isError,
          isFetching: postsQuery.isFetching,
          postsCount: posts.length,
          postsPreview: posts.slice(0, 5),
          profile: profileQuery.data,
          username,
        }}
        summary="Profile debug"
      />
    </Stack>
  )
}
