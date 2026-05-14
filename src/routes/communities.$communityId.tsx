import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Collapsible,
  Group,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Info } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { AccountProfile } from '@/features/profile/profileTypes'
import type { PostSearchResult } from '@/lib/hive/search'
import ProfileBanner from '@/components/ProfileBanner'
import useCommunityQuery from '@/features/communities/useCommunityQuery'
import useProfilesQuery from '@/features/profile/useProfilesQuery'
import PostsListSection from '@/features/posts/PostsListSection'
import { mapSearchResultToPostCardProps } from '@/features/posts/postCardMapping'
import useInfinitePostsQuery from '@/features/posts/useInfinitePostsQuery'
import DevOnly from '@/components/DevOnly'
import InfiniteDebugBanner from '@/components/InfiniteDebugBanner'
import { hiveAvatarUrl } from '@/lib/posts/tagColorConfig'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/communities/$communityId')({
  component: CommunityPage,
})

function CommunityPage() {
  const { communityId } = Route.useParams()
  const communityQuery = useCommunityQuery(communityId)
  const communityProfileQuery = useProfilesQuery([communityId])
  const communityProfile: AccountProfile | undefined =
    communityProfileQuery.data.at(0)
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

    return Array.from(unique.values()).map(mapSearchResultToPostCardProps)
  }, [postsQuery.data])

  const communityTitle = communityQuery.data?.title ?? communityId
  const communityProfileAbout = communityProfile?.about
  const communityProfileImage = communityProfile?.profileImage
  const communityCoverImage = communityProfile?.coverImage
  const communityLongDescription = communityQuery.data?.description?.trim()
  const communityDescription =
    communityQuery.data?.about ??
    communityLongDescription ??
    communityProfileAbout ??
    m.community_overview_fallback()
  const hasLongDescription =
    Boolean(communityLongDescription) &&
    communityLongDescription !== communityDescription
  const communityMeta = (
    <Stack gap={3}>
      <HStack gap={2} wrap="wrap">
        {communityQuery.data?.subscribers !== undefined ? (
          <Badge
            colorPalette="gray"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
          >
            {m.community_members({
              count: communityQuery.data.subscribers,
            })}
          </Badge>
        ) : null}
        {communityQuery.data?.lang ? (
          <Badge
            colorPalette="gray"
            variant="outline"
            borderRadius="full"
            px={3}
            py={1}
          >
            {communityQuery.data.lang.toUpperCase()}
          </Badge>
        ) : null}
        {communityQuery.data?.is_nsfw ? (
          <Badge
            colorPalette="red"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1}
          >
            {m.community_nsfw()}
          </Badge>
        ) : null}
      </HStack>
      {hasLongDescription ? (
        <Collapsible.Content>
          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="16px"
            bg="bg.subtle"
            p={{ base: 3, md: 4 }}
          >
            <Text color="fg.muted" whiteSpace="pre-wrap">
              {communityLongDescription}
            </Text>
          </Box>
        </Collapsible.Content>
      ) : null}
    </Stack>
  )

  return (
    <Stack gap={6} p={6}>
      <Collapsible.Root lazyMount unmountOnExit>
        <Stack gap={4}>
          <ProfileBanner
            actions={
              hasLongDescription ? (
                <Group bg="bg.panel" gap={2} p={1} rounded="md">
                  <Collapsible.Trigger asChild>
                    <IconButton
                      aria-label="Toggle full community description"
                      title="Toggle full community description"
                      variant="ghost"
                    >
                      <Icon as={Info} strokeWidth={2.2} />
                    </IconButton>
                  </Collapsible.Trigger>
                </Group>
              ) : null
            }
            title={communityTitle}
            subtitle={`@${communityId}`}
            description={communityDescription}
            avatarName={communityId}
            avatarUrl={communityProfileImage ?? hiveAvatarUrl(communityId)}
            coverUrl={communityCoverImage}
            meta={communityMeta}
          />
        </Stack>
      </Collapsible.Root>
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
