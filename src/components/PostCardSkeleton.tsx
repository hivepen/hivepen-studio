import { Box, HStack, Skeleton, SkeletonText, Stack } from '@chakra-ui/react'

export default function PostCardSkeleton() {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
    >
      <Stack gap={3}>
        <Skeleton height="14px" width="40%" />
        <Skeleton height="22px" width="70%" />
        <SkeletonText noOfLines={2} gap="2" />
        <HStack gap={2} wrap="wrap">
          <Skeleton height="18px" width="48px" />
          <Skeleton height="18px" width="56px" />
          <Skeleton height="18px" width="44px" />
        </HStack>
        <HStack justify="space-between" align="center">
          <HStack gap={3}>
            <Skeleton height="14px" width="60px" />
            <Skeleton height="14px" width="80px" />
          </HStack>
          <Skeleton height="90px" width={{ base: '100%', md: '180px' }} />
        </HStack>
      </Stack>
    </Box>
  )
}
