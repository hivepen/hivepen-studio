import { createFileRoute, Link } from '@tanstack/react-router'
import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import usePostQuery from '@/features/posts/usePostQuery'
import PostActions from '@/features/posts/PostActions'
import usePostCommentsQuery from '@/features/posts/usePostCommentsQuery'
import PostContent from '@/components/posts/PostContent'
import DevOnly from '@/components/DevOnly'
import { renderHiveMarkdown } from '@/lib/posts/markdown'

export const Route = createFileRoute('/post/$author/$permlink')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const { author, permlink } = Route.useParams()
  const postQuery = usePostQuery({ author, permlink })
  const commentsQuery = usePostCommentsQuery({ author, permlink })

  if (postQuery.isLoading) {
    return (
      <Stack gap={4} p={6}>
        <Button asChild variant="ghost" size="sm" alignSelf="flex-start">
          <Link to="/search">
            <HStack gap={2}>
              <ArrowLeft />
              <Text>Back to search</Text>
            </HStack>
          </Link>
        </Button>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          bg="bg.panel"
          p={{ base: 4, md: 6 }}
        >
          <Text color="fg.muted">Loading post...</Text>
        </Box>
      </Stack>
    )
  }

  if (postQuery.error || !postQuery.data) {
    return (
      <Stack gap={4} p={6}>
        <Button asChild variant="ghost" size="sm" alignSelf="flex-start">
          {/* TODO: make search query params optional so this error goes away*/}
          <Link to="/search">
            <HStack gap={2}>
              <ArrowLeft />
              <Text>Back to search</Text>
            </HStack>
          </Link>
        </Button>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          bg="bg.panel"
          p={{ base: 4, md: 6 }}
        >
          <Text color="fg.error">Unable to load this post.</Text>
        </Box>
      </Stack>
    )
  }

  const post = postQuery.data
  const renderedBody = renderHiveMarkdown(post.body)

  return (
    <Stack gap={6} p={6}>
      <Button asChild variant="ghost" size="sm" alignSelf="flex-start">
        <Link to="/search">
          <HStack gap={2}>
            <ArrowLeft />
            <Text>Back to search</Text>
          </HStack>
        </Link>
      </Button>

      <Stack gap={3}>
        <Text fontSize="sm" color="fg.muted">
          {post.community ? (
            <>
              <Link
                to="/communities/$communityId"
                params={{ communityId: post.community }}
                style={{ textDecoration: 'none' }}
              >
                <Text as="span" _hover={{ textDecoration: 'underline' }}>
                  {post.community}
                </Text>
              </Link>
              {' · '}
            </>
          ) : null}
          <Link
            to="/profile/$accountname"
            params={{ accountname: post.author }}
            style={{ textDecoration: 'none' }}
          >
            <Text as="span" _hover={{ textDecoration: 'underline' }}>
              @{post.author}
            </Text>
          </Link>
          {post.created ? ` · ${new Date(post.created).toLocaleDateString()}` : ''}
        </Text>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="600">
          {post.title || '(Untitled)'}
        </Text>
        {post.tags.length > 0 ? (
          <HStack gap={2} wrap="wrap">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="subtle" colorPalette="gray">
                #{tag}
              </Badge>
            ))}
          </HStack>
        ) : null}
      </Stack>

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="12px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <Box maxW="72ch" mx="auto">
          <PostContent body={post.body} />
        </Box>
      </Box>

      <PostActions
        author={post.author}
        permlink={post.permlink}
        voteCount={post.votes}
        commentCount={commentsQuery.data?.length}
        onCommentSuccess={() => commentsQuery.refetch()}
      />

      <DevOnly
        summary="Post debug"
        json={{ raw: post.body, rendered: renderedBody }}
      />

      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="12px"
        bg="bg.panel"
        p={{ base: 4, md: 6 }}
      >
        <Stack gap={4} maxW="72ch" mx="auto">
          <Text fontWeight="600">
            Comments ({commentsQuery.data?.length ?? 0})
          </Text>
          {commentsQuery.isLoading ? (
            <Text color="fg.muted">Loading comments...</Text>
          ) : commentsQuery.isError ? (
            <Text color="fg.error">Unable to load comments.</Text>
          ) : commentsQuery.data && commentsQuery.data.length > 0 ? (
            <Stack gap={4}>
              {commentsQuery.data.map((comment) => (
                <Box
                  key={`${comment.author}-${comment.permlink}`}
                  border="1px solid"
                  borderColor="border"
                  borderRadius="10px"
                  p={4}
                  bg="bg.subtle"
                >
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    <Link
                      to="/profile/$accountname"
                      params={{ accountname: comment.author }}
                      style={{ textDecoration: 'none' }}
                    >
                      <Text as="span" _hover={{ textDecoration: 'underline' }}>
                        @{comment.author}
                      </Text>
                    </Link>
                    {' · '}
                    {new Date(comment.created).toLocaleDateString()}
                  </Text>
                  <PostContent body={comment.body} variant="comment" />
                  <DevOnly
                    summary={`Comment debug · ${comment.author}`}
                    json={{ raw: comment.body }}
                  />
                </Box>
              ))}
            </Stack>
          ) : (
            <Text color="fg.muted">No comments yet.</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
