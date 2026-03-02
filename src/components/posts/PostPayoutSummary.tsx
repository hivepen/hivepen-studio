import { Box, HStack, Stack, Text } from '@chakra-ui/react'
import PostPayoutBadge from '@/components/posts/PostPayoutBadge'
import { m } from '@/paraglide/messages'

type PostPayoutSummaryProps = {
  author?: string
  permlink?: string
  pending: string
  total: string
  isPaidOut?: boolean
  payout?: {
    pending: string
    total: string
  }
  showDetails?: boolean
}

export default function PostPayoutSummary({
  author,
  permlink,
  pending,
  total,
  isPaidOut,
  payout,
  showDetails = true,
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
            {m.payout_summary_pending()}
          </Text>
          <Text fontSize="sm" fontWeight="600">
            {pending}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
            {m.payout_summary_total()}
          </Text>
          <Text fontSize="sm" fontWeight="600">
            {total}
          </Text>
        </HStack>
        {showDetails && author && permlink ? (
          <HStack justify="space-between">
            <Text fontSize="xs" color="fg.muted" textTransform="uppercase">
              {m.payout_summary_details()}
            </Text>
            <PostPayoutBadge
              author={author}
              permlink={permlink}
              payout={payout}
            />
          </HStack>
        ) : null}
        {isPaidOut ? (
          <Text fontSize="xs" color="fg.muted">
            {m.payout_summary_paid_out()}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
