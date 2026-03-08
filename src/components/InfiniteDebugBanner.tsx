import { Box, Code, HStack, Text } from '@chakra-ui/react'

type InfiniteDebugBannerProps = {
  pages: number
  totalPosts?: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  lastPost?: { author: string; permlink: string }
}

const shouldShow =
  import.meta.env.MODE === 'staging' ||
  import.meta.env.VITE_INFINITE_DEBUG === 'true'

const InfiniteDebugBanner = ({
  pages,
  totalPosts,
  hasNextPage,
  isFetchingNextPage,
  lastPost,
}: InfiniteDebugBannerProps) => {
  if (!shouldShow) return null

  return (
    <Box
      border="1px solid"
      borderColor="yellow.200"
      bg="yellow.50"
      borderRadius="10px"
      px={3}
      py={2}
    >
      <HStack gap={4} wrap="wrap">
        <Text fontSize="xs" fontWeight="600" color="yellow.900">
          Infinite debug
        </Text>
        <HStack gap={2}>
          <Text fontSize="xs" color="yellow.800">
            Pages
          </Text>
          <Code fontSize="xs">{pages}</Code>
        </HStack>
        {typeof totalPosts === 'number' ? (
          <HStack gap={2}>
            <Text fontSize="xs" color="yellow.800">
              Posts
            </Text>
            <Code fontSize="xs">{totalPosts}</Code>
          </HStack>
        ) : null}
        <HStack gap={2}>
          <Text fontSize="xs" color="yellow.800">
            hasNextPage
          </Text>
          <Code fontSize="xs">{String(Boolean(hasNextPage))}</Code>
        </HStack>
        <HStack gap={2}>
          <Text fontSize="xs" color="yellow.800">
            isFetchingNextPage
          </Text>
          <Code fontSize="xs">{String(Boolean(isFetchingNextPage))}</Code>
        </HStack>
        {lastPost ? (
          <HStack gap={2}>
            <Text fontSize="xs" color="yellow.800">
              Cursor
            </Text>
            <Code fontSize="xs">{`@${lastPost.author}/${lastPost.permlink}`}</Code>
          </HStack>
        ) : null}
      </HStack>
    </Box>
  )
}

export default InfiniteDebugBanner
