import { SimpleGrid, Stack, Text } from '@chakra-ui/react'
import PostCard, { PostCardProps } from '@/components/PostCard'
import PostCardSkeleton from '@/components/PostCardSkeleton'

export default function PostsListSection({
  posts,
  loading,
  emptyMessage = 'No posts found.',
  renderActions,
}: {
  posts: PostCardProps[]
  loading: boolean
  emptyMessage?: string
  renderActions?: (post: PostCardProps) => React.ReactNode
}) {
  return (
    <Stack gap={3}>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <PostCardSkeleton key={`post-skeleton-${index}`} />
            ))
          : posts.map((post) => (
              <PostCard
                key={`${post.author}-${post.permlink ?? post.title}`}
                {...post}
                actions={renderActions ? renderActions(post) : undefined}
              />
            ))}
      </SimpleGrid>
      {!loading && posts.length === 0 && (
        <Text color="fg.muted">{emptyMessage}</Text>
      )}
    </Stack>
  )
}
