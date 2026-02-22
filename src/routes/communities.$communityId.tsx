import { createFileRoute, Link } from '@tanstack/react-router'
import { Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import useCommunityQuery from '@/features/communities/useCommunityQuery'
import usePostsQuery from '@/features/posts/usePostsQuery'
import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import { useMemo, useState } from 'react'
import DevOnly from '@/components/DevOnly'

export const Route = createFileRoute('/communities/$communityId')({
  component: CommunityPage,
})

function CommunityPage() {
  const { communityId } = Route.useParams()
  const communityQuery = useCommunityQuery(communityId)
  const postsQuery = usePostsQuery({
    sort: 'created',
    tag: communityId,
    limit: 20,
  })

  const [localStats, setLocalStats] = useState<
    Record<string, { votes?: number; comments?: number }>
  >({})

  const posts = useMemo(
    () =>
      (postsQuery.data ?? []).map((post) => {
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
      }),
    [postsQuery.data, localStats]
  )

  return (
    <Stack gap={6} p={6}>
      <Button asChild variant="ghost" size="sm" alignSelf="flex-start">
        <Link to="/communities">
          <HStack gap={2}>
            <ArrowLeft />
            <Text>Back to communities</Text>
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
            {communityQuery.data?.about ?? communityQuery.data?.description ?? 'Community overview'}
          </Text>
          <HStack gap={4} fontSize="sm" color="fg.muted" wrap="wrap">
            {communityQuery.data?.name ? (
              <Text>#{communityQuery.data.name}</Text>
            ) : null}
            {communityQuery.data?.subscribers !== undefined ? (
              <Text>{communityQuery.data.subscribers} members</Text>
            ) : null}
            {communityQuery.data?.lang ? <Text>{communityQuery.data.lang}</Text> : null}
            {communityQuery.data?.is_nsfw ? <Text>NSFW</Text> : null}
          </HStack>
        </Stack>
      </Box>

      <PostsListSection
        posts={posts}
        loading={postsQuery.isFetching}
        emptyMessage="No posts found for this community."
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
        <Text color="fg.error">Failed to load community posts.</Text>
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
          localStats,
        }}
      />
    </Stack>
  )
}
