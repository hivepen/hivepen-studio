import { Box, HStack, Skeleton, SkeletonText, Stack } from '@chakra-ui/react'

export default function PostCardSkeleton() {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      overflow="hidden"
    >
      <Stack direction={{ base: 'column', xl: 'row' }} gap={0}>
        <Skeleton
          w={{ base: '100%', xl: '260px' }}
          h={{ base: '180px', xl: '100%' }}
          minH={{ xl: '220px' }}
        />
        <Stack flex="1" minW={0} p={{ base: 4, md: 5 }} gap={3}>
          <Skeleton height="14px" width="45%" />
          <Skeleton height="22px" width="70%" />
          <SkeletonText noOfLines={2} gap="2" />
          <HStack gap={2} wrap="wrap">
            <Skeleton height="18px" width="48px" />
            <Skeleton height="18px" width="56px" />
            <Skeleton height="18px" width="44px" />
          </HStack>
          <HStack justify="flex-end" gap={2} pt={2}>
            <Skeleton height="32px" width="72px" borderRadius="999px" />
            <Skeleton height="32px" width="88px" borderRadius="999px" />
          </HStack>
        </Stack>
      </Stack>
    </Box>
  )
}
