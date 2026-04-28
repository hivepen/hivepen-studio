import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Chart, useChart } from '@chakra-ui/charts'
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import { m } from '@/paraglide/messages'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { openConnectAccountDialog } from '@/lib/ui/connectAccountDialog'
import useProfileQuery from '@/features/profile/useProfileQuery'
import useAccountRewardTimeline from '@/features/analytics/useAccountRewardTimeline'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import ProfileBanner from '@/components/ProfileBanner'

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

function Analytics() {
  const [account, , accountReady] = useLocalStorageState<string | null>('hivepen.account', null)
  const profileQuery = useProfileQuery(account)
  const analyticsQuery = useAccountRewardTimeline(accountReady ? account : null)

  const chart = useChart({
    data: analyticsQuery.timeline.map((point) => ({
      amount: Number(point.totalAmount.toFixed(3)),
      label: point.shortLabel,
      longLabel: point.longLabel,
      posts: point.postCount,
    })),
    series: [{ name: 'amount', color: 'teal.solid' }],
  })

  const summaryItems = useMemo(
    () => [
      {
        label: m.analytics_summary_total_rewards(),
        value: formatRewardValue(
          analyticsQuery.summary?.totalRewardAmount ?? 0,
          analyticsQuery.summary?.symbol ?? 'HBD'
        ),
      },
      {
        label: m.analytics_summary_average_reward(),
        value: formatRewardValue(
          analyticsQuery.summary?.averageRewardAmount ?? 0,
          analyticsQuery.summary?.symbol ?? 'HBD'
        ),
      },
      {
        label: m.analytics_summary_tracked_posts(),
        value: String(analyticsQuery.summary?.trackedPostCount ?? 0),
      },
    ],
    [analyticsQuery.summary]
  )

  if (!accountReady) {
    return (
      <Stack gap={6} p={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {m.analytics_heading()}
          </Heading>
          <Text color="fg.muted">{m.analytics_description()}</Text>
        </Box>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`analytics-skeleton-${index}`} height="120px" borderRadius="16px" />
          ))}
        </SimpleGrid>
        <Skeleton height="360px" borderRadius="24px" />
      </Stack>
    )
  }

  if (!account) {
    return (
      <Stack gap={6} p={6}>
        <Box>
          <Badge colorPalette="purple" variant="subtle" mb={2}>
            {m.analytics_badge()}
          </Badge>
          <Heading size="lg" mb={2}>
            {m.analytics_heading()}
          </Heading>
          <Text color="fg.muted">{m.analytics_description()}</Text>
        </Box>

        <Card.Root variant="outline">
          <Card.Body>
            <Stack gap={4} align="start">
              <Heading size="md">{m.analytics_connect_title()}</Heading>
              <Text color="fg.muted">{m.analytics_connect_description()}</Text>
              <Button colorPalette="gray" onClick={openConnectAccountDialog}>
                {m.analytics_connect_button()}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    )
  }

  return (
    <Stack gap={6} p={6}>
      <Box>
        <Badge colorPalette="purple" variant="subtle" mb={2}>
          {m.analytics_badge()}
        </Badge>
        <Heading size="lg" mb={2}>
          {m.analytics_heading()}
        </Heading>
        <Text color="fg.muted">{m.analytics_description()}</Text>
      </Box>

      <ProfileBanner
        title={profileQuery.data?.displayName || `@${account}`}
        subtitle={`@${account}`}
        description={m.analytics_profile_description()}
        avatarName={account}
        avatarUrl={profileQuery.data?.profileImage ?? getHiveAvatarUrl(account)}
        coverUrl={profileQuery.data?.coverImage}
        meta={
          <HStack gap={4} wrap="wrap" color="fg.muted" fontSize="sm">
            <Text>{m.analytics_summary_last_updated({ date: formatUpdatedAt(analyticsQuery.lastUpdatedAt) })}</Text>
            {analyticsQuery.isRefreshing ? <Text>{m.analytics_refreshing()}</Text> : null}
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        {summaryItems.map((item) => (
          <Card.Root key={item.label} variant="outline">
            <Card.Body>
              <Stack gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {item.label}
                </Text>
                {analyticsQuery.isLoading ? (
                  <Skeleton height="28px" width="70%" />
                ) : (
                  <Heading size="md">{item.value}</Heading>
                )}
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <Card.Root variant="outline">
        <Card.Body>
          <Stack gap={4}>
            <Stack gap={1}>
              <Heading size="md">{m.analytics_chart_title()}</Heading>
              <Text color="fg.muted">{m.analytics_chart_description()}</Text>
            </Stack>

            {analyticsQuery.isLoading ? (
              <Skeleton height="320px" borderRadius="16px" />
            ) : analyticsQuery.timeline.some((point) => point.postCount > 0) ? (
              <Chart.Root height="20rem" chart={chart}>
                <RechartsLineChart data={chart.data} responsive>
                  <CartesianGrid stroke={chart.color('border.muted')} vertical={false} />
                  <XAxis
                    axisLine={false}
                    tickLine={false}
                    dataKey={chart.key('label')}
                    stroke={chart.color('border')}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    stroke={chart.color('border')}
                    tickFormatter={(value) =>
                      formatRewardValue(
                        typeof value === 'number' ? value : Number(value),
                        analyticsQuery.summary?.symbol ?? 'HBD'
                      )
                    }
                  />
                  <Tooltip
                    animationDuration={100}
                    cursor={false}
                    content={
                      <Chart.Tooltip
                        formatter={(value) =>
                          formatRewardValue(
                            typeof value === 'number' ? value : Number(value),
                            analyticsQuery.summary?.symbol ?? 'HBD'
                          )
                        }
                      />
                    }
                  />
                  {chart.series.map((item) => (
                    <Line
                      key={item.name}
                      isAnimationActive={false}
                      dataKey={chart.key(item.name)}
                      stroke={chart.color(item.color)}
                      strokeWidth={3}
                      dot={{ r: 4, stroke: chart.color('bg') }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </RechartsLineChart>
              </Chart.Root>
            ) : (
              <Box
                border="1px dashed"
                borderColor="border"
                borderRadius="16px"
                p={6}
                bg="bg.subtle"
              >
                <Text color="fg.muted">{m.analytics_chart_empty()}</Text>
              </Box>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  )
}

const formatRewardValue = (amount: number, symbol: string) =>
  `${amount.toFixed(3)} ${symbol}`

const formatUpdatedAt = (value: number | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}
