import { Box, HStack, Stack, Text } from '@chakra-ui/react'

type PostPayoutSummaryProps = {
  pending: string
  total: string
  isPaidOut?: boolean
}

export default function PostPayoutSummary({
  pending,
  total,
  isPaidOut,
}: PostPayoutSummaryProps) {
  return (
    <Box
      alignSelf="flex-end"
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.subtle"
      p={3}
      minW={{ base: '100%', sm: '260px' }}
    >
      <Stack gap={2}>
        <HStack justify="space-between">
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
            Pending payout
          </Text>
          <Text fontSize="sm" fontWeight="600">
            {pending}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
            Total payout
          </Text>
          <Text fontSize="sm" fontWeight="600">
            {total}
          </Text>
        </HStack>
        {isPaidOut ? (
          <Text fontSize="xs" color="fg.muted">
            Paid out
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
