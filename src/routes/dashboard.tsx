import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Icon,
  SegmentGroup,
  Separator,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  Text,
  Timeline,
} from '@chakra-ui/react'
import { Chart, useChart } from '@chakra-ui/charts'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  BadgeCheck,
  Coins,
  Crown,
  Droplets,
  Gauge,
  Gem,
  HandCoins,
  HandHeart,
  Landmark,
  PiggyBank,
  ReceiptText,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComponentProps, ReactNode } from 'react'
import type {
  DashboardHistoricalOverview,
  DashboardRange,
} from '@/features/dashboard/types'
import { Avatar } from '@/components/ui/avatar'
import useDashboardQuery from '@/features/dashboard/useDashboardQuery'
import useProfileQuery from '@/features/profile/useProfileQuery'
import useWalletQuery from '@/features/wallet/useWalletQuery'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { openConnectAccountDialog } from '@/lib/ui/connectAccountDialog'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { formatFullDateTime, formatRelativeTime } from '@/lib/i18n/relativeTime'
import { getLocale } from '@/paraglide/runtime'
import { m } from '@/paraglide/messages'
import { PostCardMedia } from '@/components/PostCard'
import { getTitleMeta } from '@/lib/posts/titleMeta'
import { resolvePostCommunity } from '@/features/posts/postCardMapping'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

const RANGE_OPTIONS: Array<{ label: DashboardRange; value: DashboardRange }> = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
]

const CHART_SERIES = {
  author: { color: 'green.solid', label: 'Author', key: 'authorRewards' },
  curation: {
    color: 'purple.solid',
    label: 'Curation',
    key: 'curationRewards',
  },
  interest: {
    color: 'yellow.solid',
    label: 'Interest',
    key: 'savingsInterest',
  },
  total: { color: 'teal.solid', label: 'Total', key: 'totalRewards' },
  votes: { color: 'green.solid', label: 'Votes', key: 'votes' },
  comments: { color: 'purple.solid', label: 'Comments', key: 'comments' },
  posts: { color: 'blue.solid', label: 'Posts', key: 'posts' },
} as const

type TrendDirection = 'up' | 'down' | 'flat'
type DashboardFocus = 'all' | 'rewards' | 'publishing' | 'account'

const PAGE_MAX_WIDTH = '1240px'
const SURFACE_RADIUS = '16px'
const CHART_MARGIN = { top: 8, right: 10, left: -18, bottom: 0 }
const BAR_CHART_MARGIN = { top: 8, right: 10, left: -10, bottom: 0 }

const FOCUS_OPTIONS: Array<{ label: string; value: DashboardFocus }> = [
  { label: 'All', value: 'all' },
  { label: 'Rewards', value: 'rewards' },
  { label: 'Publishing', value: 'publishing' },
  { label: 'Account', value: 'account' },
]

function Dashboard() {
  const [account, , accountReady] = useLocalStorageState<string | null>(
    'hivepen.account',
    null,
  )
  const [range, setRange] = useState<DashboardRange>('3M')
  const [focus, setFocus] = useState<DashboardFocus>('all')
  const locale = getLocale()

  const normalizedAccount = accountReady ? account : null
  const profileQuery = useProfileQuery(normalizedAccount)
  const walletQuery = useWalletQuery(normalizedAccount)
  const dashboardQuery = useDashboardQuery(normalizedAccount, range)

  if (!accountReady) {
    return (
      <Stack gap={6} p={6}>
        <Skeleton height="96px" borderRadius="24px" />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`dashboard-stat-skeleton-${index}`}
              height="164px"
              borderRadius="20px"
            />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, xl: 3 }} gap={4}>
          <Skeleton height="360px" borderRadius="24px" />
          <Skeleton height="360px" borderRadius="24px" />
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
          <Skeleton height="320px" borderRadius="24px" />
          <Skeleton height="320px" borderRadius="24px" />
        </SimpleGrid>
        <Skeleton height="320px" borderRadius="24px" />
      </Stack>
    )
  }

  if (!account) {
    return (
      <Stack gap={6} p={6}>
        <Card.Root variant="outline">
          <Card.Body>
            <Stack gap={4} align="start">
              <Badge colorPalette="purple" variant="subtle">
                Command center
              </Badge>
              <Stack gap={1}>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700">
                  Your Hive dashboard starts with a connected account
                </Text>
                <Text color="fg.muted" maxW="720px">
                  Track reward income, post performance, account activity, and
                  portfolio signals from one place.
                </Text>
              </Stack>
              <Button colorPalette="gray" onClick={openConnectAccountDialog}>
                {m.analytics_connect_button()}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    )
  }

  const profile = profileQuery.data
  const wallet = walletQuery.data
  const overview = dashboardQuery.data
  const accountLabel = profile?.displayName || `@${account}`
  const lastSyncedAt = Math.max(
    overview?.cachedAt ?? 0,
    wallet?.fetchedAt ?? 0,
    dashboardQuery.lastUpdatedAt ?? 0,
  )
  const followerCount = profile?.followerCount ?? null
  const followingCount = profile?.followingCount ?? null
  const totalPosts = profile?.postCount ?? null

  const statCards = [
    {
      category: 'account',
      label: 'Hive Power',
      palette: 'green',
      icon: Crown,
      value:
        wallet?.metrics.effectiveHivePower != null
          ? formatTokenAmount(wallet.metrics.effectiveHivePower, 2)
          : null,
      suffix: ' HP',
      trend: null,
      description:
        wallet?.metrics.delegatedHivePower != null
          ? `${formatTokenAmount(wallet.metrics.hivePower, 2)} owned · ${formatTokenAmount(wallet.metrics.delegatedHivePower, 2)} delegated out`
          : 'Effective stake across owned and delegated balances',
    },
    {
      category: 'rewards',
      label: 'HBD Savings',
      palette: 'yellow',
      icon: Droplets,
      value:
        wallet?.metrics.savingsHbd != null
          ? formatTokenAmount(wallet.metrics.savingsHbd, 3)
          : null,
      suffix: ' HBD',
      trend: null,
      description:
        wallet?.metrics.hbdInterestRate != null
          ? `${formatPercent(wallet.metrics.hbdInterestRate / 100, 1)} APR on savings`
          : 'Savings balance available on-chain',
    },
    {
      category: 'rewards',
      label: 'Total rewards',
      palette: 'purple',
      icon: HandCoins,
      value:
        overview?.summary.totalRewards != null
          ? formatTokenAmount(overview.summary.totalRewards, 2)
          : null,
      suffix: ' HBD',
      trend: overview?.summary.totalRewardsChange ?? null,
      description: `${rangeToDescription(range)} across author, curation, and interest income`,
    },
    {
      category: 'account',
      label: 'Voting power',
      palette: 'green',
      icon: Gauge,
      value:
        wallet?.metrics.votingManaPercent != null
          ? formatTokenAmount(wallet.metrics.votingManaPercent, 1)
          : null,
      suffix: '%',
      trend: null,
      description:
        wallet?.metrics.downvoteManaPercent != null
          ? `${formatTokenAmount(wallet.metrics.downvoteManaPercent, 1)}% downvote mana available`
          : 'Mana regenerates continuously over time',
    },
    {
      category: 'publishing',
      label: 'Posts published',
      palette: 'purple',
      icon: WalletCards,
      value: totalPosts != null ? String(totalPosts) : null,
      suffix: '',
      trend: null,
      description:
        overview?.summary.publishedPosts != null
          ? `${overview.summary.publishedPosts} published in ${rangeToDescription(range)}`
          : 'Published posts found through public Hive APIs',
    },
    {
      category: 'account',
      label: 'Followers',
      palette: 'green',
      icon: UserRound,
      value: followerCount != null ? formatInteger(followerCount) : null,
      suffix: '',
      trend: null,
      description:
        followingCount != null
          ? `Following ${formatInteger(followingCount)} accounts`
          : 'Follower count from the connected profile',
    },
    {
      category: 'publishing',
      label: 'Avg post reward',
      palette: 'yellow',
      icon: Gem,
      value:
        overview?.summary.averagePostReward != null
          ? formatTokenAmount(overview.summary.averagePostReward, 2)
          : null,
      suffix: ' HBD',
      trend: overview?.summary.averagePostRewardChange ?? null,
      description: `Average total payout per post in ${rangeToDescription(range)}`,
    },
    {
      category: 'account',
      label: 'Account age',
      palette: 'gray',
      icon: Activity,
      value: wallet?.account.created
        ? formatAccountAge(wallet.account.created)
        : null,
      suffix: '',
      trend: null,
      description: wallet?.account.created
        ? `Member since ${new Date(wallet.account.created).toLocaleDateString(
            undefined,
            {
              month: 'long',
              year: 'numeric',
            },
          )}`
        : 'Age based on on-chain account creation time',
    },
  ]

  return (
    <Stack gap={3} p={{ base: 3, md: 4 }} mx="auto" maxW={PAGE_MAX_WIDTH}>
      <Stack p={{ base: 4, md: 5 }} gap={3}>
        <HStack justify="space-between" align="start" wrap="wrap" gap={4}>
          <Stack gap={2}>
            <HStack gap={3} px={3} py={2} minW={{ md: '220px' }}>
              <Avatar
                size="sm"
                name={account}
                src={profile?.profileImage ?? getHiveAvatarUrl(account)}
              />
              <Stack gap={0} flex="1">
                <Text fontWeight="600" lineClamp={1} fontSize="sm">
                  {accountLabel}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  @{account}
                </Text>
              </Stack>
            </HStack>
          </Stack>

          <HStack gap={3} wrap="wrap" justify="flex-end">
            <Stack gap={1}>
              <Text
                fontSize="xs"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="0.14em"
              >
                Focus
              </Text>
              <SegmentGroup.Root
                size="sm"
                value={focus}
                onValueChange={(event) =>
                  setFocus(event.value as DashboardFocus)
                }
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={FOCUS_OPTIONS} />
              </SegmentGroup.Root>
            </Stack>
            <Stack gap={1}>
              <Text
                fontSize="xs"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="0.14em"
              >
                Range
              </Text>
              <SegmentGroup.Root
                size="sm"
                value={range}
                onValueChange={(event) =>
                  setRange(event.value as DashboardRange)
                }
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items items={RANGE_OPTIONS} />
              </SegmentGroup.Root>
            </Stack>
          </HStack>
        </HStack>

        <HStack gap={3} wrap="wrap" color="fg.muted" fontSize="xs">
          <Text>
            {lastSyncedAt > 0
              ? `Last sync ${formatRelativeTime(
                  new Date(lastSyncedAt),
                  locale,
                )}`
              : 'Preparing dashboard snapshot'}
          </Text>
          {lastSyncedAt > 0 ? (
            <Text title={formatFullDateTime(new Date(lastSyncedAt), locale)}>
              {formatFullDateTime(new Date(lastSyncedAt), locale)}
            </Text>
          ) : null}
        </HStack>
      </Stack>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4, xl: 5 }} gap={2.5}>
        {statCards
          .filter((card) => matchesDashboardFocus(card.category, focus))
          .map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              palette={card.palette}
              icon={card.icon}
              value={card.value}
              suffix={card.suffix}
              description={card.description}
              trend={card.trend}
              isLoading={
                dashboardQuery.isLoading ||
                walletQuery.isLoading ||
                profileQuery.isLoading
              }
            />
          ))}
      </SimpleGrid>

      {matchesDashboardFocus('rewards', focus) ? (
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={2.5} alignItems="stretch">
          <ChartPanel
            title="Reward income by type"
            subtitle="Author · curation · interest · weekly HBD"
            gridColumn={{ base: 'auto', lg: 'span 2' }}
            isLoading={dashboardQuery.isLoading}
          >
            <RewardIncomeChart overview={overview} />
          </ChartPanel>
          <ChartPanel
            title="Reward breakdown"
            subtitle="% of total income"
            isLoading={dashboardQuery.isLoading}
          >
            <RewardBreakdownChart overview={overview} />
          </ChartPanel>
        </SimpleGrid>
      ) : null}

      {focus === 'all' || focus === 'rewards' || focus === 'publishing' ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2.5}>
          {matchesDashboardFocus('rewards', focus) ? (
            <ChartPanel
              title="Reward trend"
              subtitle="Combined rewards · weekly"
              isLoading={dashboardQuery.isLoading}
            >
              <RewardTrendChart overview={overview} />
            </ChartPanel>
          ) : null}
          {matchesDashboardFocus('publishing', focus) ? (
            <ChartPanel
              title="Author rewards"
              subtitle="Weekly HBD payout"
              isLoading={dashboardQuery.isLoading}
            >
              <AuthorRewardsChart overview={overview} />
            </ChartPanel>
          ) : null}
        </SimpleGrid>
      ) : null}

      {matchesDashboardFocus('publishing', focus) ? (
        <ChartPanel
          title="Engagement trend"
          subtitle="Votes · comments · posts"
          isLoading={dashboardQuery.isLoading}
        >
          <EngagementChart overview={overview} />
        </ChartPanel>
      ) : null}

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2.5}>
        {focus === 'all' || focus === 'publishing' || focus === 'rewards' ? (
          <Card.Root variant="outline" borderRadius={SURFACE_RADIUS}>
            <Card.Body>
              <Stack gap={4}>
                <Stack gap={1}>
                  <Text fontWeight="600">Top posts</Text>
                  <Text fontSize="sm" color="fg.muted">
                    Ranked by total reward in {rangeToDescription(range)}
                  </Text>
                </Stack>
                <Separator />
                <Stack gap={1}>
                  {dashboardQuery.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton
                        key={`post-skeleton-${index}`}
                        height="60px"
                        borderRadius="16px"
                      />
                    ))
                  ) : overview?.topPosts.length ? (
                    overview.topPosts.map((post, index) => {
                      const community = resolvePostCommunity(post)

                      return (
                        <HStack
                          key={post.id}
                          gap={3}
                          align="start"
                          py={2}
                          borderBottom={
                            index === overview.topPosts.length - 1
                              ? 'none'
                              : '1px solid'
                          }
                          borderColor="border.subtle"
                        >
                          <Box
                            minW="24px"
                            h="24px"
                            borderRadius="8px"
                            bg="bg.subtle"
                            color="fg.muted"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xs"
                            fontFamily="mono"
                          >
                            {index + 1}
                          </Box>
                          <PostCardMedia
                            author={post.author}
                            coverUrl={post.coverUrl}
                            shortTitle={getTitleMeta(post.title).shortTitle}
                          />
                          <Stack gap={1} flex="1" minW={0}>
                            <Link
                              to="/post/$author/$permlink"
                              params={{
                                author: post.author,
                                permlink: post.permlink,
                              }}
                            >
                              <Text fontWeight="600" lineClamp={1}>
                                {post.title}
                              </Text>
                            </Link>
                            <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                              {post.votes} votes · {post.comments} comments
                              {community ? ' · on ' : ''}
                              {community?.id ? (
                                <Link
                                  to="/communities/$communityId"
                                  params={{ communityId: community.id }}
                                >
                                  <Text
                                    as="span"
                                    _hover={{ textDecoration: 'underline' }}
                                  >
                                    {community.label}
                                  </Text>
                                </Link>
                              ) : community ? (
                                community.label
                              ) : null}
                              {post.primaryTag ? ` · ${post.primaryTag}` : ''}
                            </Text>
                          </Stack>
                          <Text
                            color="green.fg"
                            fontFamily="mono"
                            fontSize="sm"
                            whiteSpace="nowrap"
                          >
                            {formatTokenAmount(post.totalReward, 2)} HBD
                          </Text>
                        </HStack>
                      )
                    })
                  ) : (
                    <EmptyStateMessage message="No rewarded posts were found for this period." />
                  )}
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : null}

        {focus === 'all' || focus === 'account' ? (
          <Card.Root variant="outline" borderRadius={SURFACE_RADIUS}>
            <Card.Body>
              <Stack gap={4}>
                <Stack gap={1}>
                  <Text fontWeight="600">Recent activity</Text>
                  <Text fontSize="sm" color="fg.muted">
                    Latest wallet and reward events from the connected account
                  </Text>
                </Stack>
                <Separator />
                {walletQuery.isLoading ? (
                  <Stack gap={1}>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={`activity-skeleton-${index}`}
                        height="54px"
                        borderRadius="16px"
                      />
                    ))}
                  </Stack>
                ) : wallet?.activity.length ? (
                  <Timeline.Root size="sm" variant="subtle">
                    {wallet.activity.slice(0, 6).map((item, index, items) => {
                      const palette = getActivityPalette(item.type)

                      return (
                        <Timeline.Item key={item.id}>
                          <Timeline.Connector>
                            {index < items.length - 1 ? (
                              <Timeline.Separator />
                            ) : null}
                            <Timeline.Indicator
                              bg={`${palette}.solid`}
                              color={`${palette}.contrast`}
                            >
                              <Icon
                                as={getActivityIcon(item.type)}
                                boxSize={3}
                              />
                            </Timeline.Indicator>
                          </Timeline.Connector>
                          <Timeline.Content>
                            <HStack
                              justify="space-between"
                              align="start"
                              gap={3}
                            >
                              <Stack gap={1} flex="1">
                                <Timeline.Title>
                                  {item.description}
                                </Timeline.Title>
                                <Timeline.Description>
                                  {formatRelativeTime(
                                    new Date(item.timestamp),
                                    locale,
                                  )}
                                </Timeline.Description>
                              </Stack>
                              <Text
                                fontSize="sm"
                                fontFamily="mono"
                                color={
                                  item.amount ? `${palette}.fg` : 'fg.muted'
                                }
                                whiteSpace="nowrap"
                              >
                                {item.amount || 'Event'}
                              </Text>
                            </HStack>
                          </Timeline.Content>
                        </Timeline.Item>
                      )
                    })}
                  </Timeline.Root>
                ) : (
                  <EmptyStateMessage message="No recent account activity was returned by the Hive API." />
                )}
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : null}
      </SimpleGrid>

      <HStack
        justify="space-between"
        wrap="wrap"
        color="fg.muted"
        fontSize="sm"
      >
        <Text>Hive dashboard · data via public Hive APIs</Text>
        <Text fontFamily="mono">
          {dashboardQuery.isRefreshing || walletQuery.isFetching
            ? 'sync status: refreshing'
            : 'sync status: idle'}
        </Text>
      </HStack>
    </Stack>
  )
}

function MetricCard({
  label,
  value,
  suffix,
  description,
  palette,
  icon,
  trend,
  isLoading,
}: {
  label: string
  value: string | null
  suffix: string
  description: string
  palette: string
  icon: typeof Crown
  trend: number | null
  isLoading: boolean
}) {
  return (
    <Card.Root
      variant="outline"
      colorPalette={palette}
      borderRadius={SURFACE_RADIUS}
      overflow="hidden"
      bg="bg.panel"
      borderColor="border.muted"
    >
      <Card.Body p={{ base: 4, md: 4.5 }}>
        <Stat.Root>
          <Stack gap={4}>
            <HStack justify="space-between" align="center">
              <Stack gap={4}>
                <Stat.Label color="fg.muted" fontSize="xs">
                  {label}
                </Stat.Label>
                {isLoading ? (
                  <Skeleton height="32px" width="70%" />
                ) : (
                  <Stat.ValueText fontSize="xl" lineHeight="1.05">
                    {value ?? '—'}
                    {suffix ? (
                      <Stat.ValueUnit color="fg.muted" fontSize="xs">
                        {suffix}
                      </Stat.ValueUnit>
                    ) : null}
                  </Stat.ValueText>
                )}
              </Stack>
              <Box
                boxSize="8"
                borderRadius="9px"
                bg="colorPalette.subtle"
                color="colorPalette.fg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={icon} boxSize={4} />
              </Box>
            </HStack>

            <Text fontSize="xs" color="fg.muted" lineClamp={2}>
              {description}
            </Text>
          </Stack>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  )
}

function TrendBadge({ change }: { change: number }) {
  const direction: TrendDirection =
    change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const palette =
    direction === 'up' ? 'green' : direction === 'down' ? 'red' : 'gray'
  const prefix = direction === 'down' ? '' : '+'

  return (
    <Badge colorPalette={palette} variant="subtle" borderRadius="full">
      {prefix}
      {formatPercent(change, 1)}
    </Badge>
  )
}

function ChartPanel({
  title,
  subtitle,
  children,
  gridColumn,
  isLoading,
}: {
  title: string
  subtitle: string
  children: ReactNode
  gridColumn?: ComponentProps<typeof Card.Root>['gridColumn']
  isLoading: boolean
}) {
  return (
    <Card.Root
      variant="outline"
      borderRadius={SURFACE_RADIUS}
      gridColumn={gridColumn}
      bg="bg.panel"
      overflow="hidden"
    >
      <Card.Body>
        <Stack gap={3}>
          <Stack gap={1}>
            <Text fontWeight="600">{title}</Text>
            <Text
              fontSize="xs"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="0.16em"
              fontFamily="mono"
            >
              {subtitle}
            </Text>
          </Stack>
          {isLoading ? (
            <Skeleton height="220px" borderRadius="16px" />
          ) : (
            children
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

function RewardIncomeChart({
  overview,
}: {
  overview: DashboardHistoricalOverview | null
}) {
  if (!overview) {
    return <EmptyStateMessage message="No reward history is available yet." />
  }

  const chart = useChart({
    data: overview.buckets,
    series: [
      {
        name: CHART_SERIES.author.key,
        color: CHART_SERIES.author.color,
        label: CHART_SERIES.author.label,
      },
      {
        name: CHART_SERIES.curation.key,
        color: CHART_SERIES.curation.color,
        label: CHART_SERIES.curation.label,
      },
      {
        name: CHART_SERIES.interest.key,
        color: CHART_SERIES.interest.color,
        label: CHART_SERIES.interest.label,
      },
    ],
  })
  const maxValue = getChartMax(overview.buckets, [
    CHART_SERIES.author.key,
    CHART_SERIES.curation.key,
    CHART_SERIES.interest.key,
  ])
  const upperBound = getPaddedUpperBound(maxValue, 0.18, 0.8)

  return (
    <Stack gap={3}>
      <Chart.Root height="13rem" chart={chart}>
        {overview.rewardIncomeChartKind === 'bar' ? (
          <BarChart
            data={chart.data}
            barGap={10}
            margin={BAR_CHART_MARGIN}
            responsive
          >
            <CartesianGrid
              stroke={chart.color('border.muted')}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key('shortLabel')}
              stroke={chart.color('border')}
              minTickGap={20}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              stroke={chart.color('border')}
              width={30}
              tick={{ fontSize: 11 }}
              domain={[0, upperBound]}
              tickFormatter={(value) =>
                formatCompactCurrency(
                  typeof value === 'number' ? value : Number(value),
                )
              }
            />
            <Tooltip
              animationDuration={100}
              cursor={false}
              content={
                <Chart.Tooltip
                  formatter={(value) =>
                    `${formatTokenAmount(Number(value), 2)} HBD`
                  }
                />
              }
            />
            {chart.series.map((item) => (
              <Bar
                key={item.name}
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={chart.color(item.color)}
                radius={6}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={chart.data} margin={CHART_MARGIN} responsive>
            <CartesianGrid
              stroke={chart.color('border.muted')}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key('shortLabel')}
              stroke={chart.color('border')}
              minTickGap={20}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              stroke={chart.color('border')}
              width={30}
              tick={{ fontSize: 11 }}
              domain={[0, upperBound]}
              tickFormatter={(value) =>
                formatCompactCurrency(
                  typeof value === 'number' ? value : Number(value),
                )
              }
            />
            <Tooltip
              animationDuration={100}
              cursor={false}
              content={
                <Chart.Tooltip
                  formatter={(value) =>
                    `${formatTokenAmount(Number(value), 2)} HBD`
                  }
                />
              }
            />
            {chart.series.map((item) => (
              <defs key={`reward-gradient-${item.name}`}>
                <Chart.Gradient
                  id={`reward-gradient-${item.name}`}
                  stops={[
                    { offset: '0%', color: item.color, opacity: 0.3 },
                    { offset: '100%', color: item.color, opacity: 0.04 },
                  ]}
                />
              </defs>
            ))}
            {chart.series.map((item) => (
              <Area
                key={item.name}
                type="monotone"
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={`url(#reward-gradient-${item.name})`}
                stroke={chart.color(item.color)}
                strokeWidth={2}
                baseValue={0}
                strokeLinecap="round"
              />
            ))}
          </AreaChart>
        )}
      </Chart.Root>

      <HStack gap={5} wrap="wrap">
        {overview.breakdown.map((item) => (
          <SeriesLegend
            key={item.id}
            color={item.colorToken}
            label={item.label}
            value={`${formatTokenAmount(item.value, 2)} HBD`}
          />
        ))}
      </HStack>
    </Stack>
  )
}

function RewardBreakdownChart({
  overview,
}: {
  overview: DashboardHistoricalOverview | null
}) {
  if (!overview) {
    return <EmptyStateMessage message="No reward breakdown is available yet." />
  }

  const chart = useChart({
    data: overview.breakdown.map((item) => ({
      ...item,
      valuePercent: item.share * 100,
    })),
  })

  return (
    <Stack gap={3}>
      <Chart.Root height="13rem" chart={chart}>
        <PieChart responsive>
          <Tooltip
            animationDuration={100}
            cursor={false}
            content={
              <Chart.Tooltip
                formatter={(value) =>
                  `${formatTokenAmount(Number(value), 2)} HBD`
                }
              />
            }
          />
          <Pie
            innerRadius={44}
            outerRadius={72}
            isAnimationActive={false}
            data={chart.data}
            dataKey={chart.key('value')}
            nameKey={chart.key('label')}
            paddingAngle={4}
            cornerRadius={6}
            shape={(props) => (
              <Sector
                {...props}
                fill={chart.color(props.payload!.colorToken)}
              />
            )}
          />
        </PieChart>
      </Chart.Root>

      <Stack gap={2}>
        {overview.breakdown.map((item) => (
          <HStack key={item.id} justify="space-between">
            <SeriesLegend color={item.colorToken} label={item.label} value="" />
            <Text fontFamily="mono" fontSize="sm">
              {formatPercent(item.share, 1)}
            </Text>
          </HStack>
        ))}
      </Stack>
    </Stack>
  )
}

function RewardTrendChart({
  overview,
}: {
  overview: DashboardHistoricalOverview | null
}) {
  if (!overview) {
    return (
      <EmptyStateMessage message="No reward trend data is available yet." />
    )
  }

  const chart = useChart({
    data: overview.buckets,
    series: [{ name: CHART_SERIES.total.key, color: CHART_SERIES.total.color }],
  })
  const maxValue = getChartMax(overview.buckets, [CHART_SERIES.total.key])
  const upperBound = getPaddedUpperBound(maxValue, 0.18, 0.8)

  return (
    <Chart.Root height="11.5rem" chart={chart}>
      {overview.rewardTrendChartKind === 'bar' ? (
        <BarChart data={chart.data} margin={BAR_CHART_MARGIN} responsive>
          <CartesianGrid
            stroke={chart.color('border.muted')}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key('shortLabel')}
            stroke={chart.color('border')}
            minTickGap={20}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            stroke={chart.color('border')}
            width={30}
            tick={{ fontSize: 11 }}
            domain={[0, upperBound]}
            tickFormatter={(value) =>
              formatCompactCurrency(
                typeof value === 'number' ? value : Number(value),
              )
            }
          />
          <Tooltip
            animationDuration={100}
            cursor={false}
            content={
              <Chart.Tooltip
                formatter={(value) =>
                  `${formatTokenAmount(Number(value), 2)} HBD`
                }
              />
            }
          />
          <Bar
            isAnimationActive={false}
            dataKey={chart.key(CHART_SERIES.total.key)}
            fill={chart.color(CHART_SERIES.total.color)}
            radius={6}
          />
        </BarChart>
      ) : (
        <AreaChart data={chart.data} margin={CHART_MARGIN} responsive>
          <CartesianGrid
            stroke={chart.color('border.muted')}
            vertical={false}
          />
          <XAxis
            axisLine={false}
            tickLine={false}
            dataKey={chart.key('shortLabel')}
            stroke={chart.color('border')}
            minTickGap={20}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            stroke={chart.color('border')}
            width={30}
            tick={{ fontSize: 11 }}
            domain={[0, upperBound]}
            tickFormatter={(value) =>
              formatCompactCurrency(
                typeof value === 'number' ? value : Number(value),
              )
            }
          />
          <Tooltip
            animationDuration={100}
            cursor={false}
            content={
              <Chart.Tooltip
                formatter={(value) =>
                  `${formatTokenAmount(Number(value), 2)} HBD`
                }
              />
            }
          />
          <defs>
            <Chart.Gradient
              id="reward-trend-gradient"
              stops={[
                {
                  offset: '0%',
                  color: CHART_SERIES.total.color,
                  opacity: 0.28,
                },
                {
                  offset: '100%',
                  color: CHART_SERIES.total.color,
                  opacity: 0.04,
                },
              ]}
            />
          </defs>
          <Area
            type="monotone"
            isAnimationActive={false}
            dataKey={chart.key(CHART_SERIES.total.key)}
            fill="url(#reward-trend-gradient)"
            stroke={chart.color(CHART_SERIES.total.color)}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 4,
              stroke: chart.color('bg'),
              strokeWidth: 2,
            }}
            baseValue={0}
            strokeLinecap="round"
          />
        </AreaChart>
      )}
    </Chart.Root>
  )
}

function AuthorRewardsChart({
  overview,
}: {
  overview: DashboardHistoricalOverview | null
}) {
  if (!overview) {
    return (
      <EmptyStateMessage message="No author reward data is available yet." />
    )
  }

  const chart = useChart({
    data: overview.buckets,
    series: [
      { name: CHART_SERIES.author.key, color: CHART_SERIES.author.color },
    ],
  })
  const maxValue = getChartMax(overview.buckets, [CHART_SERIES.author.key])
  const upperBound = getPaddedUpperBound(maxValue, 0.15, 0.4)

  return (
    <Chart.Root height="11.5rem" chart={chart}>
      <BarChart
        data={chart.data}
        barCategoryGap="26%"
        margin={BAR_CHART_MARGIN}
        responsive
      >
        <CartesianGrid stroke={chart.color('border.muted')} vertical={false} />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey={chart.key('shortLabel')}
          stroke={chart.color('border')}
          minTickGap={20}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          stroke={chart.color('border')}
          width={30}
          tick={{ fontSize: 11 }}
          domain={[0, upperBound]}
          tickFormatter={(value) =>
            formatCompactCurrency(
              typeof value === 'number' ? value : Number(value),
            )
          }
        />
        <Tooltip
          animationDuration={100}
          cursor={false}
          content={
            <Chart.Tooltip
              formatter={(value) =>
                `${formatTokenAmount(Number(value), 2)} HBD`
              }
            />
          }
        />
        <Bar
          isAnimationActive={false}
          dataKey={chart.key(CHART_SERIES.author.key)}
          fill={chart.color(CHART_SERIES.author.color)}
          radius={6}
        />
      </BarChart>
    </Chart.Root>
  )
}

function EngagementChart({
  overview,
}: {
  overview: DashboardHistoricalOverview | null
}) {
  if (!overview) {
    return <EmptyStateMessage message="No engagement data is available yet." />
  }

  const chart = useChart({
    data: overview.buckets,
    series: [
      { name: CHART_SERIES.votes.key, color: CHART_SERIES.votes.color },
      {
        name: CHART_SERIES.comments.key,
        color: CHART_SERIES.comments.color,
      },
      { name: CHART_SERIES.posts.key, color: CHART_SERIES.posts.color },
    ],
  })
  const maxValue = getChartMax(overview.buckets, [
    CHART_SERIES.votes.key,
    CHART_SERIES.comments.key,
    CHART_SERIES.posts.key,
  ])
  const upperBound = getPaddedUpperBound(maxValue, 0.15, 4)

  return (
    <Stack gap={3}>
      <Chart.Root height="11.5rem" chart={chart}>
        {overview.engagementChartKind === 'bar' ? (
          <BarChart
            data={chart.data}
            barGap={10}
            margin={BAR_CHART_MARGIN}
            responsive
          >
            <CartesianGrid
              stroke={chart.color('border.muted')}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key('shortLabel')}
              stroke={chart.color('border')}
              minTickGap={20}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              stroke={chart.color('border')}
              width={30}
              tick={{ fontSize: 11 }}
              domain={[0, upperBound]}
            />
            <Tooltip
              animationDuration={100}
              cursor={false}
              content={<Chart.Tooltip />}
            />
            {chart.series.map((item) => (
              <Bar
                key={item.name}
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={chart.color(item.color)}
                radius={6}
              />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={chart.data} margin={CHART_MARGIN} responsive>
            <CartesianGrid
              stroke={chart.color('border.muted')}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key('shortLabel')}
              stroke={chart.color('border')}
              minTickGap={20}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              stroke={chart.color('border')}
              width={30}
              tick={{ fontSize: 11 }}
              domain={[0, upperBound]}
            />
            <Tooltip
              animationDuration={100}
              cursor={false}
              content={<Chart.Tooltip />}
            />
            {chart.series.map((item) => (
              <defs key={`engagement-gradient-${item.name}`}>
                <Chart.Gradient
                  id={`engagement-gradient-${item.name}`}
                  stops={[
                    { offset: '0%', color: item.color, opacity: 0.2 },
                    { offset: '100%', color: item.color, opacity: 0.03 },
                  ]}
                />
              </defs>
            ))}
            {chart.series.map((item) => (
              <Area
                key={item.name}
                type="monotone"
                isAnimationActive={false}
                dataKey={chart.key(item.name)}
                fill={`url(#engagement-gradient-${item.name})`}
                stroke={chart.color(item.color)}
                strokeWidth={2.2}
                dot={false}
                baseValue={0}
                strokeLinecap="round"
              />
            ))}
          </AreaChart>
        )}
      </Chart.Root>

      <HStack gap={5} wrap="wrap">
        <SeriesLegend
          color={CHART_SERIES.votes.color}
          label="Votes"
          value={String(
            overview.buckets.reduce((total, bucket) => total + bucket.votes, 0),
          )}
        />
        <SeriesLegend
          color={CHART_SERIES.comments.color}
          label="Comments"
          value={String(
            overview.buckets.reduce(
              (total, bucket) => total + bucket.comments,
              0,
            ),
          )}
        />
        <SeriesLegend
          color={CHART_SERIES.posts.color}
          label="Posts"
          value={String(
            overview.buckets.reduce((total, bucket) => total + bucket.posts, 0),
          )}
        />
      </HStack>
    </Stack>
  )
}

function SeriesLegend({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: string
}) {
  return (
    <HStack gap={2.5}>
      <Box boxSize="8px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      {value ? (
        <Text fontSize="sm" fontFamily="mono">
          {value}
        </Text>
      ) : null}
    </HStack>
  )
}

function EmptyStateMessage({ message }: { message: string }) {
  return (
    <Box
      minH="11rem"
      border="1px dashed"
      borderColor="border.muted"
      borderRadius="16px"
      bg="bg.subtle"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
      textAlign="center"
    >
      <Text color="fg.muted">{message}</Text>
    </Box>
  )
}

function rangeToDescription(range: DashboardRange) {
  switch (range) {
    case '1M':
      return 'the last month'
    case '3M':
      return 'the last 3 months'
    case '6M':
      return 'the last 6 months'
    case '1Y':
      return 'the last year'
  }
}

function formatTokenAmount(value: number, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat().format(value)
}

function formatPercent(value: number, digits = 1) {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function getChartMax<T extends Record<string, unknown>>(
  rows: Array<T>,
  keys: Array<string>,
) {
  return rows.reduce((max, row) => {
    const rowMax = keys.reduce((current, key) => {
      const value = row[key]
      return typeof value === 'number' && Number.isFinite(value)
        ? Math.max(current, value)
        : current
    }, 0)

    return Math.max(max, rowMax)
  }, 0)
}

function getPaddedUpperBound(value: number, ratio: number, minPad: number) {
  if (value <= 0) return minPad * 4
  return Number((value + Math.max(minPad, value * ratio)).toFixed(2))
}

function matchesDashboardFocus(
  category: Exclude<DashboardFocus, 'all'>,
  focus: DashboardFocus,
) {
  return focus === 'all' || focus === category
}

function formatAccountAge(value: string) {
  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) return '—'

  const now = new Date()
  let years = now.getUTCFullYear() - createdAt.getUTCFullYear()
  let months = now.getUTCMonth() - createdAt.getUTCMonth()

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0) {
    return `${months}m`
  }

  return `${years}y ${months}m`
}

function getActivityPalette(type: string) {
  if (
    type === 'author_reward' ||
    type === 'curation_reward' ||
    type === 'interest'
  ) {
    return 'green'
  }
  if (type === 'transfer' || type === 'transfer_to_vesting') {
    return 'blue'
  }
  if (type === 'withdraw_vesting' || type === 'fill_vesting_withdraw') {
    return 'orange'
  }
  return 'purple'
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'transfer':
      return Send
    case 'transfer_to_vesting':
      return ArrowUpToLine
    case 'transfer_to_savings':
      return PiggyBank
    case 'transfer_from_savings':
      return ArrowDownToLine
    case 'fill_vesting_withdraw':
    case 'withdraw_vesting':
      return TrendingDown
    case 'delegate_vesting_shares':
    case 'return_vesting_delegation':
      return HandHeart
    case 'claim_reward_balance':
      return ReceiptText
    case 'author_reward':
    case 'curation_reward':
      return Coins
    case 'interest':
      return Sparkles
    case 'update_proposal_votes':
      return Landmark
    case 'account_witness_vote':
      return ShieldCheck
    case 'custom_json':
      return Repeat
    default:
      return BadgeCheck
  }
}
