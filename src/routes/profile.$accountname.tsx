import { createFileRoute } from '@tanstack/react-router'
import { Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@/components/ui/avatar'
import PostsListSection from '@/features/posts/PostsListSection'
import PostActions from '@/features/posts/PostActions'
import usePostsQuery from '@/features/posts/usePostsQuery'
import useProfileQuery from '@/features/profile/useProfileQuery'
import { useMemo, useState } from 'react'
import DevOnly from '@/components/DevOnly'

export const Route = createFileRoute('/profile/$accountname')({
  component: ProfilePage,
})

function ProfilePage() {
  const { accountname } = Route.useParams()
  const username = accountname.replace(/^@/, '')

  const profileQuery = useProfileQuery(username)
  const postsQuery = usePostsQuery({
    source: 'account',
    sort: 'posts',
    author: username,
    limit: 20,
  })

  const [localStats, setLocalStats] = useState<Record<string, { votes?: number; comments?: number }>>({})

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
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="16px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <HStack align="center" justify="space-between" wrap="wrap">
          <HStack gap={4} align="center">
            <Avatar
              size="lg"
              src={profileQuery.data?.profileImage}
              name={username}
            />
            <Box>
              <Heading size="md">@{username}</Heading>
              <Text color="fg.muted" mt={1} maxW="520px">
                {profileQuery.data?.about ?? 'Hive account profile'}
              </Text>
              <HStack gap={4} mt={3} color="fg.muted" fontSize="sm">
                {profileQuery.data?.postCount !== undefined ? (
                  <Text>{profileQuery.data.postCount} posts</Text>
                ) : null}
                {profileQuery.data?.followerCount !== undefined ? (
                  <Text>{profileQuery.data.followerCount} followers</Text>
                ) : null}
                {profileQuery.data?.followingCount !== undefined ? (
                  <Text>{profileQuery.data.followingCount} following</Text>
                ) : null}
              </HStack>
            </Box>
          </HStack>
          <HStack gap={2}>
            <Button variant="outline">Follow</Button>
            <Button variant="outline">Message</Button>
          </HStack>
        </HStack>
      </Box>

      <Box>
        <Heading size="md" mb={3}>
          Posts
        </Heading>
        <PostsListSection
          posts={posts}
          loading={postsQuery.isFetching}
          emptyMessage="No posts found for this account."
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
