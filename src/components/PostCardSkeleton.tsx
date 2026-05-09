import { Card, HStack, Skeleton, SkeletonText, Stack } from '@chakra-ui/react'

export default function PostCardSkeleton() {
  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      flexDirection={{ base: 'column', lg: 'row' }}
      bg="bg.panel"
      borderColor="border"
      borderWidth="1px"
      borderRadius="12px"
    >
      <Stack flex="1" minW={0} gap={0}>
        <Card.Header pb={0} px={{ base: 3, md: 4 }} pt={{ base: 3, md: 4 }}>
          <HStack justify="space-between" align="start" gap={3}>
            <HStack gap={3} align="start" minW={0}>
              <Skeleton boxSize={10} borderRadius="full" flexShrink={0} />
              <Stack gap={1} minW={0}>
                <Skeleton height="14px" width="88px" />
                <HStack gap={2}>
                  <Skeleton height="10px" width="56px" />
                  <Skeleton height="10px" width="72px" />
                  <Skeleton height="10px" width="44px" />
                </HStack>
              </Stack>
            </HStack>
            <HStack gap={2} display={{ base: 'none', sm: 'flex' }}>
              <Skeleton height="28px" width="88px" borderRadius="lg" />
              <Skeleton height="32px" width="32px" borderRadius="full" />
            </HStack>
          </HStack>
        </Card.Header>

        <Card.Body pt={2} px={{ base: 3, md: 4 }} pb={2}>
          <HStack align="start">
            <Skeleton
              height={{ base: 'clamp(4rem,10vh,5.5rem)' }}
              aspectRatio={4 / 3}
              bg="bg.subtle"
              position="relative"
              overflow="hidden"
              flexShrink={0}
              borderRadius="md"
            />
            <Stack gap={3} flex="1" minW={0}>
              <Stack gap={2}>
                <Skeleton height="22px" width="88%" />
                <Skeleton height="22px" width="64%" />
              </Stack>
              <SkeletonText noOfLines={2} gap="2" />
            </Stack>
          </HStack>
        </Card.Body>

        <Card.Footer pt={2} px={{ base: 3, md: 4 }} pb={{ base: 3, md: 4 }}>
          <HStack justify="space-between" align="center" wrap="wrap" gap={2} w="full">
            <HStack gap={2}>
              <Skeleton height="32px" width="32px" borderRadius="full" />
              <Skeleton height="32px" width="32px" borderRadius="full" />
              <Skeleton height="32px" width="32px" borderRadius="full" />
            </HStack>
            <Skeleton height="24px" width="68px" borderRadius="full" />
          </HStack>
        </Card.Footer>
      </Stack>
    </Card.Root>
  )
}
