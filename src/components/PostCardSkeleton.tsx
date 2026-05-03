import { Box, HStack, Skeleton, SkeletonText, Stack } from '@chakra-ui/react'

export default function PostCardSkeleton() {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      overflow="hidden"
      flexDirection={{ base: 'column', lg: 'row' }}
      display="flex"
    >
      <Stack flex="1" minW={0} p={{ base: 3, md: 4 }} gap={3}>
        <Skeleton
          height={{ base: 'clamp(4rem,10vh,5.5rem)' }}
          aspectRatio={4 / 3}
          bg="bg.subtle"
          position="relative"
          overflow="hidden"
          flexShrink={0}
          borderRadius="md"
        />
        <HStack justify="space-between" align="start" gap={3}>
          <HStack gap={3} align="start">
            <Skeleton boxSize={10} borderRadius="full" />
            <Stack gap={1}>
              <Skeleton height="14px" width="80px" />
              <Skeleton height="12px" width="60px" />
            </Stack>
          </HStack>
          <Skeleton
            height="24px"
            width="80px"
            borderRadius="lg"
            display={{ base: 'none', sm: 'flex' }}
          />
        </HStack>

        <Stack gap={2}>
          <Skeleton height="20px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </Stack>

        <SkeletonText noOfLines={2} gap="2" />

        <HStack gap={2} wrap="wrap">
          <Skeleton height="18px" width="48px" borderRadius="full" />
          <Skeleton height="18px" width="56px" borderRadius="full" />
          <Skeleton height="18px" width="44px" borderRadius="full" />
        </HStack>

        <HStack justify="space-between" pt={2}>
          <HStack gap={2}>
            <Skeleton height="32px" width="32px" borderRadius="full" />
            <Skeleton height="32px" width="32px" borderRadius="full" />
            <Skeleton height="32px" width="32px" borderRadius="full" />
          </HStack>
          <Skeleton height="24px" width="60px" borderRadius="full" />
        </HStack>
      </Stack>
    </Box>
  )
}
