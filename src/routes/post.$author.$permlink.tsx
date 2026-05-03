import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge, Box, Button, HStack, Stack, Tabs, Text } from '@chakra-ui/react'
import { ArrowLeft } from 'lucide-react'
import { getPostQueryOptions, type Entry } from '@ecency/sdk'
import usePostQuery, {
  mapEntryToPost
} from '@/features/posts/usePostQuery'
import PostActions from '@/features/posts/PostActions'
import usePostCommentsQuery from '@/features/posts/usePostCommentsQuery'
import PostContent from '@/components/posts/PostContent'
import PostPayoutSummary from '@/components/posts/PostPayoutSummary'
import PostPayoutBadge from '@/components/posts/PostPayoutBadge'
import PostTag from '@/components/PostTag'
import DevOnly from '@/components/DevOnly'
import { renderHiveMarkdown } from '@/lib/posts/markdown'
import { m } from '@/paraglide/messages'
import { APP_CONFIG } from '@/lib/constants'

export const Route = createFileRoute('/post/$author/$permlink')({
  component: PostDetailPage,
  loader: async ({ params, context }) => {
    const { author, permlink } = params
    const { queryClient } = context

    if (!author || !permlink) {
      throw new Error('Author and permlink are required')
    }

    const postQueryOptions = getPostQueryOptions(author, permlink)
    const entry = await queryClient.fetchQuery(postQueryOptions)

    if (!entry) {
      throw new Error('Post not found')
    }

    const post = mapEntryToPost(entry)

    return {
      post,
    }
  },
  head: ({ loaderData, params }) => ({
    meta: [
      { title: loaderData?.post?.title || 'Untitled Post' },
      {
        name: 'description',
        content: loaderData?.post?.body?.slice(0, 160) || '',
      },
      // Open Graph
      {
        property: 'og:title',
        content: loaderData?.post?.title || 'Untitled Post',
      },
      {
        property: 'og:description',
        content: loaderData?.post?.body?.slice(0, 160) || '',
      },
      { property: 'og:type', content: 'article' },
      { property: 'og:site_name', content: APP_CONFIG.SITE_NAME },
      { 
        property: 'og:url', 
        content: typeof window !== 'undefined' 
          ? window.location.href 
          : `${APP_CONFIG.BASE_URL}/post/${params.author}/${params.permlink}` 
      },
      { 
        property: 'og:image', 
        content: loaderData?.post?.coverUrl || `${APP_CONFIG.BASE_URL}/og-image.png` 
      },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: loaderData?.post?.title || 'Untitled Post',
      },
      {
        name: 'twitter:description',
        content: loaderData?.post?.body?.slice(0, 160) || '',
      },
      { 
        name: 'twitter:url', 
        content: typeof window !== 'undefined' 
          ? window.location.href 
          : `${APP_CONFIG.BASE_URL}/post/${params.author}/${params.permlink}` 
      },
      { 
        name: 'twitter:image', 
        content: loaderData?.post?.coverUrl || `${APP_CONFIG.BASE_URL}/og-image.png` 
      },
    ],
  }),
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
              <Text>{m.post_back_to_search()}</Text>
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
          <Text color="fg.muted">{m.post_loading()}</Text>
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
              <Text>{m.post_back_to_search()}</Text>
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
          <Text color="fg.error">{m.post_error()}</Text>
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
            <Text>{m.post_back_to_search()}</Text>
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
            to="/$accountname"
            params={{ accountname: `@${post.author}` }}
            style={{ textDecoration: 'none' }}
          >
            <Text as="span" _hover={{ textDecoration: 'underline' }}>
              @{post.author}
            </Text>
          </Link>
          {post.created
            ? ` · ${new Date(post.created).toLocaleDateString()}`
            : ''}
        </Text>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="600">
          {post.title || m.post_untitled()}
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

      <Tabs.Root
        defaultValue="post"
        variant="outline"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        <Tabs.List>
          <Tabs.Trigger value="post">{m.post_tab_post()}</Tabs.Trigger>
          <Tabs.Trigger value="details">{m.post_tab_details()}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="post">
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
        </Tabs.Content>
        <Tabs.Content value="details">
          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="12px"
            bg="bg.panel"
            p={{ base: 4, md: 6 }}
          >
            <Stack gap={4} maxW="72ch" mx="auto">
              <Stack gap={2}>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                  {m.post_details_app()}
                </Text>
                {post.app ? (
                  <PostTag tag={`app:${post.app}`} />
                ) : (
                  <Text fontSize="sm" color="fg.muted">
                    {m.post_details_unknown()}
                  </Text>
                )}
              </Stack>

              <Stack gap={2}>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                  {m.post_details_rewards()}
                </Text>
                <PostPayoutSummary
                  pending={post.payout.pending}
                  total={post.payout.total}
                  isPaidOut={post.payout.isPaidOut}
                  payout={post.payout}
                  showDetails={false}
                />
              </Stack>

              <Stack gap={2}>
                <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
                  {m.post_details_timing()}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {m.post_details_created({
                    date: new Date(post.created).toLocaleString(),
                  })}
                </Text>
                {post.updated ? (
                  <Text fontSize="sm" color="fg.muted">
                    {m.post_details_updated({
                      date: new Date(post.updated).toLocaleString(),
                    })}
                  </Text>
                ) : null}
                {post.payoutAt ? (
                  <Text fontSize="sm" color="fg.muted">
                    {m.post_details_payout({
                      date: new Date(post.payoutAt).toLocaleString(),
                    })}
                  </Text>
                ) : null}
              </Stack>

              {post.beneficiaries && post.beneficiaries.length > 0 ? (
                <Stack gap={2}>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                  >
                    {m.post_details_beneficiaries()}
                  </Text>
                  <Stack gap={1}>
                    {post.beneficiaries.map((beneficiary) => (
                      <HStack key={beneficiary.account} justify="space-between">
                        <Text fontSize="sm">@{beneficiary.account}</Text>
                        <Text fontSize="sm" color="fg.muted">
                          {(beneficiary.weight / 100).toFixed(2)}%
                        </Text>
                      </HStack>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          </Box>
        </Tabs.Content>
      </Tabs.Root>

      <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
        <PostPayoutBadge
          author={post.author}
          permlink={post.permlink}
          payout={post.payout}
        />
        <PostActions
          author={post.author}
          permlink={post.permlink}
          voteCount={post.votes}
          commentCount={commentsQuery.data?.length}
          onCommentSuccess={() => commentsQuery.refetch()}
        />
      </HStack>

      <DevOnly
        summary="Post debug"
        json={{ raw: post.body, rendered: renderedBody, payout: post.payout }}
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
            {m.post_comments_title({ count: commentsQuery.data?.length ?? 0 })}
          </Text>
          {commentsQuery.isLoading ? (
            <Text color="fg.muted">{m.post_comments_loading()}</Text>
          ) : commentsQuery.isError ? (
            <Text color="fg.error">{m.post_comments_error()}</Text>
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
                      to="/$accountname"
                      params={{ accountname: `@${comment.author}` }}
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
            <Text color="fg.muted">{m.post_comments_empty()}</Text>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
