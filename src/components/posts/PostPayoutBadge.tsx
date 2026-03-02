import {
  Badge,
  Box,
  HStack,
  Popover,
  Portal,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getDynamicPropsQueryOptions,
  getPostQueryOptions,
  type Entry,
} from '@ecency/sdk'
import { parseAssetAmount, sumAssetStrings } from '@/lib/hive/payouts'

type PostPayoutBadgeProps = {
  author: string
  permlink?: string
  payout?: {
    pending: string
    total: string
  }
}

const formatUsd = (value: string | undefined) => {
  if (!value) return '—'
  const parsed = parseAssetAmount(value)
  if (!parsed) return value
  return `$ ${parsed.amount.toFixed(3)}`
}

const formatCountdown = (payoutAt?: string, isPaidOut?: boolean) => {
  if (isPaidOut) return 'paid out'
  if (!payoutAt) return 'unknown'
  const target = new Date(payoutAt).getTime()
  if (!Number.isFinite(target)) return 'unknown'
  const diffMs = target - Date.now()
  if (diffMs <= 0) return 'paid out'
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  if (days >= 1) return `in ${days} day${days === 1 ? '' : 's'}`
  const hours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (hours >= 1) return `in ${hours} hour${hours === 1 ? '' : 's'}`
  const minutes = Math.ceil(diffMs / (60 * 1000))
  return `in ${minutes} min`
}

const resolvePayoutString = (entry: Entry | undefined, fallback?: string) => {
  if (entry?.pending_payout_value) return entry.pending_payout_value
  return fallback
}

const formatPercent = (weight: number) => {
  const percent = weight / 100
  return Number.isInteger(percent) ? `${percent.toFixed(0)}%` : `${percent.toFixed(2)}%`
}

export default function PostPayoutBadge({
  author,
  permlink,
  payout,
}: PostPayoutBadgeProps) {
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const shouldFetch = hasOpened && Boolean(permlink)
  const postQuery = useQuery({
    ...getPostQueryOptions(author, permlink),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  const dynamicPropsQuery = useQuery({
    ...getDynamicPropsQueryOptions(),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const entry = postQuery.data ?? undefined
  const pendingValue = resolvePayoutString(entry, payout?.pending)
  const paidOutTotal = entry
    ? sumAssetStrings(entry.author_payout_value, entry.curator_payout_value)
    : null
  const totalValue = paidOutTotal ?? payout?.total ?? pendingValue
  const pendingParsed = pendingValue ? parseAssetAmount(pendingValue) : null
  const totalParsed = totalValue ? parseAssetAmount(totalValue) : null
  const pendingAmount = pendingParsed?.amount ?? 0
  const isPaidOut = entry?.is_paidout ?? false
  const pendingLabel = pendingParsed && pendingAmount > 0
    ? `$ ${pendingParsed.amount.toFixed(3)}`
    : totalParsed
      ? `$ ${totalParsed.amount.toFixed(3)}`
      : payout?.pending ?? 'Rewards'

  const priceBase = dynamicPropsQuery.data?.base
  const priceQuote = dynamicPropsQuery.data?.quote
  const price =
    typeof priceBase === 'number' && typeof priceQuote === 'number' && priceBase > 0
      ? priceQuote / priceBase
      : null
  const breakdownSource =
    pendingParsed && pendingAmount > 0 ? pendingParsed : totalParsed
  const totalHive =
    breakdownSource?.symbol === 'HBD' && price
      ? breakdownSource.amount * price
      : breakdownSource?.symbol === 'HIVE' || breakdownSource?.symbol === 'HP'
        ? breakdownSource.amount
        : null
  const hiveAmount = totalHive !== null ? totalHive / 2 : null
  const hpAmount = totalHive !== null ? totalHive / 2 : null

  const beneficiaries = entry?.beneficiaries ?? []
  const payoutCountdown = formatCountdown(entry?.payout_at, entry?.is_paidout)
  const authorPayout = entry?.author_payout_value
  const curatorPayout = entry?.curator_payout_value
  const showPending = !isPaidOut && Boolean(pendingValue)
  const showPaidOut = isPaidOut && (authorPayout || curatorPayout)
  const showCountdown = !isPaidOut

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open)
        if (details.open) {
          setHasOpened(true)
        }
      }}
      positioning={{ placement: 'top-start' }}
    >
      <Popover.Trigger asChild>
        <Badge
          variant="subtle"
          colorPalette="gray"
          textTransform="uppercase"
          cursor="pointer"
        >
          {pendingLabel}
        </Badge>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            bg="bg.panel"
            border="1px solid"
            borderColor="border"
            borderRadius="12px"
            p={3}
            minW="240px"
            maxW="280px"
            boxShadow="lg"
          >
            <Stack gap={3}>
              {showPending ? (
                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                  >
                    Pending payout
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    {formatUsd(pendingValue)}
                  </Text>
                </Box>
              ) : null}

              {postQuery.isLoading ? (
                <Stack gap={2}>
                  <Skeleton height="12px" />
                  <Skeleton height="12px" />
                </Stack>
              ) : beneficiaries.length > 0 ? (
                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    mb={1}
                  >
                    Beneficiary
                  </Text>
                  <Stack gap={1}>
                    {beneficiaries.map((beneficiary) => (
                      <HStack key={beneficiary.account} justify="space-between">
                        <Text fontSize="xs">{beneficiary.account}</Text>
                        <Text fontSize="xs" color="fg.muted">
                          {formatPercent(beneficiary.weight)}
                        </Text>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              <Box>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  mb={1}
                >
                  Breakdown
                </Text>
                <Stack gap={1}>
                  {hiveAmount !== null && hpAmount !== null ? (
                    <>
                      <HStack justify="space-between">
                        <Text fontSize="xs">{hiveAmount.toFixed(3)} HIVE</Text>
                        <Text fontSize="xs" color="fg.muted">
                          Liquid
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs">{hpAmount.toFixed(3)} HP</Text>
                        <Text fontSize="xs" color="fg.muted">
                          Vesting
                        </Text>
                      </HStack>
                    </>
                  ) : (
                    <Text fontSize="xs" color="fg.muted">
                      Breakdown unavailable
                    </Text>
                  )}
                </Stack>
              </Box>

              {showPaidOut && (
                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    mb={1}
                  >
                    Paid out
                  </Text>
                  <Stack gap={1}>
                    {authorPayout ? (
                      <HStack justify="space-between">
                        <Text fontSize="xs">Author</Text>
                        <Text fontSize="xs" color="fg.muted">
                          {authorPayout}
                        </Text>
                      </HStack>
                    ) : null}
                    {curatorPayout ? (
                      <HStack justify="space-between">
                        <Text fontSize="xs">Curator</Text>
                        <Text fontSize="xs" color="fg.muted">
                          {curatorPayout}
                        </Text>
                      </HStack>
                    ) : null}
                  </Stack>
                </Box>
              )}

              {showCountdown ? (
                <Box>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                  >
                    Payout
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {payoutCountdown}
                  </Text>
                </Box>
              ) : null}
            </Stack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}
