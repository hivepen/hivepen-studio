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
  Text,
  Timeline,
} from '@chakra-ui/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BadgeCheck,
  BellIcon,
  CalendarIcon,
  Coins,
  HandHeart,
  Landmark,
  PiggyBank,
  ReceiptText,
  Repeat,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  DashboardChartId,
  DashboardFocus,
} from '@/features/dashboard/dashboardCharts'
import type {
  DashboardHistoricalOverview,
  DashboardRange,
} from '@/features/dashboard/types'
import CommunityRewardBreakdownChart from '@/features/dashboard/CommunityRewardBreakdownChart'
import HpDelegationDonutChart from '@/features/dashboard/HpDelegationDonutChart'
import IncomeBreakdownChart from '@/features/dashboard/IncomeBreakdownChart'
import PayoutDistributionChart from '@/features/dashboard/PayoutDistributionChart'
import PostPerformanceScatterChart from '@/features/dashboard/PostPerformanceScatterChart'
import RewardIncomeHeatmapChart from '@/features/dashboard/RewardIncomeHeatmapChart'
import RewardIncomeStackedChart from '@/features/dashboard/RewardIncomeStackedChart'
import HbdIcon from '@/components/hive/HbdIcon'
import HiveIcon from '@/components/hive/HiveIcon'
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
import MiniSparkline from '@/features/dashboard/MiniSparkline'
import PublishingCadenceChart from '@/features/dashboard/PublishingCadenceChart'
import VotingPowerMedia from '@/features/dashboard/VotingPowerMedia'
import {
  DASHBOARD_CHART_IDS,
  isDashboardChartVisible,
} from '@/features/dashboard/dashboardCharts'
import {
  ChartPanel,
  EmptyStateMessage,
  MetricCard,
  SeriesLegend,
} from '@/features/dashboard/DashboardSurface'
import DashboardChartVisibilitySelect from '@/features/dashboard/DashboardChartVisibilitySelect'
import ArticleChevronUp from '@/components/icons/ArticleChevronUpIcon'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

const RANGE_OPTIONS: Array<{ label: DashboardRange; value: DashboardRange }> = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
]

const PAGE_MAX_WIDTH = '1240px'
const SURFACE_RADIUS = '16px'
const FOCUS_OPTIONS: Array<{ label: string; value: DashboardFocus }> = [
  { label: 'All', value: 'all' },
  { label: 'Rewards', value: 'rewards' },
  { label: 'Publishing', value: 'publishing' },
  { label: 'Account', value: 'account' },
]

export function AccountAnalyticsPage({
  accountname,
}: {
  accountname?: string
}) {
  const [hasHydrated, setHasHydrated] = useState(false)
  const [activeAccount, , accountReady] = useLocalStorageState<string | null>(
    'hivepen.account',
    null,
  )
  const [range, setRange] = useState<DashboardRange>('3M')
  const [focus, setFocus] = useState<DashboardFocus>('all')
  const [visibleCharts, setVisibleCharts] = useLocalStorageState<
    Array<DashboardChartId>
  >('hivepen.dashboard.visibleCharts', DASHBOARD_CHART_IDS)
  const locale = getLocale()
  useEffect(() => {
    setHasHydrated(true)
  }, [])
  const routeAccount = accountname?.replace(/^@/, '') ?? null
  const isScopedAccountView = routeAccount !== null
  const account = isScopedAccountView
    ? routeAccount
    : accountReady
      ? activeAccount
      : null

  const profileQuery = useProfileQuery(account)
  const walletQuery = useWalletQuery(account)
  const dashboardQuery = useDashboardQuery(account, range)

  if (!isScopedAccountView && !accountReady) {
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
  const visibleChartSet = new Set<DashboardChartId>(
    visibleCharts.length > 0 ? visibleCharts : DASHBOARD_CHART_IDS,
  )

  const statCards: Array<{
    category: Exclude<DashboardFocus, 'all'>
    label: string
    palette: string
    icon?: ReactNode
    media?: ReactNode
    value: string | null
    suffix: string
    description?: string
    children?: ReactNode
  }> = [
    {
      category: 'account',
      label: 'Hive Power',
      palette: 'orange',
      icon: <HiveIcon boxSize={4} color="orange.fg" />,
      value:
        wallet?.metrics.effectiveHivePower != null
          ? formatTokenAmount(wallet.metrics.effectiveHivePower, 2)
          : null,
      suffix: ' HP',
      children: renderHivePowerCardBody(wallet?.metrics ?? null),
    },
    {
      category: 'rewards',
      label: 'Total rewards',
      palette: 'green',
      icon: <Icon as={Coins} boxSize={4} />,
      value:
        overview?.summary.totalRewards != null
          ? formatTokenAmount(overview.summary.totalRewards, 2)
          : null,
      suffix: ' HBD',
      description:
        overview?.summary.totalRewardsChange != null
          ? formatChangeLabel(overview.summary.totalRewardsChange)
          : undefined,
      media:
        overview?.buckets && overview.buckets.length >= 4 ? (
          <Box w="80px" flexShrink={0}>
            <MiniSparkline
              data={overview.buckets.map((b) => b.totalRewards)}
              colorToken="green.solid"
              type="area"
              height={36}
            />
          </Box>
        ) : undefined,
    },
    {
      category: 'rewards',
      label: 'Curation income',
      palette: 'purple',
      icon: <Icon as={HandHeart} boxSize={4} />,
      value:
        overview?.breakdown.find((b) => b.id === 'curation')?.value != null
          ? formatTokenAmount(
              overview.breakdown.find((b) => b.id === 'curation')!.value,
              2,
            )
          : null,
      suffix: ' HBD',
      media:
        overview?.buckets && overview.buckets.length >= 4 ? (
          <Box w="80px" flexShrink={0}>
            <MiniSparkline
              data={overview.buckets.map((b) => b.curationRewards)}
              colorToken="purple.solid"
              type="area"
              height={36}
            />
          </Box>
        ) : undefined,
    },
    {
      category: 'rewards',
      label: 'HBD Savings',
      palette: 'green',
      icon: <HbdIcon boxSize={4} />,
      value:
        wallet?.metrics.savingsHbd != null
          ? formatTokenAmount(wallet.metrics.savingsHbd, 3)
          : null,
      suffix: ' HBD',
      children: renderSavingsCardBody(
        wallet?.metrics.savingsHbd ?? null,
        wallet?.metrics.hbdInterestRate ?? null,
      ),
    },
    {
      category: 'account',
      label: 'Voting power',
      palette: 'green',
      media: (
        <VotingPowerMedia value={wallet?.metrics.votingManaPercent ?? null} />
      ),
      value:
        wallet?.metrics.votingManaPercent != null
          ? formatTokenAmount(wallet.metrics.votingManaPercent, 1)
          : null,
      suffix: '%',
    },
    {
      category: 'publishing',
      label: 'Posts published',
      palette: 'purple',
      icon: <Icon as={WalletCards} boxSize={4} />,
      value: totalPosts != null ? String(totalPosts) : null,
      suffix: '',
      description: formatPublishingContext(
        overview?.summary.publishedPosts ?? null,
        totalPosts,
        range,
      ),
    },
    {
      category: 'account',
      label: 'Followers',
      palette: 'green',
      icon: <Icon as={BellIcon} boxSize={4} />,
      value: followerCount != null ? formatInteger(followerCount) : null,
      suffix: '',
      description:
        followingCount != null && followerCount != null
          ? `Following ${formatInteger(followingCount)} · ${formatFollowRatio(followerCount, followingCount)}`
          : followingCount != null
            ? `Following ${formatInteger(followingCount)} accounts`
            : undefined,
    },
    {
      category: 'publishing',
      label: 'Avg post reward',
      palette: 'yellow',
      icon: <Icon as={ArticleChevronUp} boxSize={4} />,
      value:
        overview?.summary.averagePostReward != null
          ? formatTokenAmount(overview.summary.averagePostReward, 2)
          : null,
      suffix: ' HBD',
      description:
        overview?.summary.publishedPosts != null
          ? `${overview.summary.publishedPosts} posts · ${formatTokenAmount(overview.summary.totalRewards, 2)} HBD total`
          : undefined,
      media:
        overview?.buckets && overview.buckets.length >= 4 ? (
          <Box w="80px" flexShrink={0}>
            <MiniSparkline
              data={overview.buckets.map((b) =>
                b.posts > 0 ? b.authorRewards / b.posts : 0,
              )}
              colorToken="green.solid"
              type="bar"
              height={36}
            />
          </Box>
        ) : undefined,
    },
    {
      category: 'account',
      label: 'Account age',
      palette: 'gray',
      icon: <Icon as={CalendarIcon} boxSize={4} />,
      value: wallet?.account.created
        ? formatAccountAge(wallet.account.created)
        : null,
      suffix: '',
      description: formatAccountMilestone(wallet?.account.created ?? null),
    },
  ]

  return (
    <Stack
      gap={3}
      px={{ base: 3, md: 4 }}
      pt={3}
      pb="20vh"
      mx="auto"
      maxW={PAGE_MAX_WIDTH}
    >
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
        </HStack>

        <HStack gap={3} wrap="wrap" color="fg.muted" fontSize="xs">
          <Text suppressHydrationWarning>
            {hasHydrated && lastSyncedAt > 0
              ? `Last sync ${formatRelativeTime(
                  new Date(lastSyncedAt),
                  locale,
                )}`
              : 'Preparing dashboard snapshot'}
          </Text>
          {hasHydrated && lastSyncedAt > 0 ? (
            <Text title={formatFullDateTime(new Date(lastSyncedAt), locale)}>
              {formatFullDateTime(new Date(lastSyncedAt), locale)}
            </Text>
          ) : null}
        </HStack>
      </Stack>

      <HStack
        position="sticky"
        top={0}
        zIndex={10}
        justify="flex-end"
        gap={3}
        wrap="wrap"
        px={{ base: 3, md: 4 }}
        py={3}
        mt={-1}
        bg="bg"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        backdropFilter="blur(12px)"
      >
        <SegmentGroup.Root
          size="sm"
          value={focus}
          onValueChange={(event) => setFocus(event.value as DashboardFocus)}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={FOCUS_OPTIONS} />
        </SegmentGroup.Root>
        <SegmentGroup.Root
          size="sm"
          value={range}
          onValueChange={(event) => setRange(event.value as DashboardRange)}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={RANGE_OPTIONS} />
        </SegmentGroup.Root>
        <DashboardChartVisibilitySelect
          value={visibleCharts.length > 0 ? visibleCharts : DASHBOARD_CHART_IDS}
          onValueChange={(value) => setVisibleCharts(value)}
        />
      </HStack>

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4, xl: 5 }} gap={2.5}>
        {statCards
          .filter((card) => matchesDashboardFocus(card.category, focus))
          .map((card) => (
            <MetricCard
              key={card.label}
              label={card.label}
              palette={card.palette}
              icon={card.icon}
              media={card.media}
              value={card.value}
              suffix={card.suffix}
              description={card.description}
              children={card.children}
              isLoading={
                dashboardQuery.isLoading ||
                walletQuery.isLoading ||
                profileQuery.isLoading
              }
            />
          ))}
      </SimpleGrid>

      {isDashboardChartVisible('reward-income', focus, visibleChartSet) ? (
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={2.5} alignItems="stretch">
          <ChartPanel
            title="Reward income"
            subtitle="Author · curation · interest"
            gridColumn={{ base: 'auto', lg: 'span 2' }}
            isLoading={dashboardQuery.isLoading}
          >
            <RewardIncomeChart overview={overview} focus={focus} />
          </ChartPanel>
        </SimpleGrid>
      ) : null}

      {isDashboardChartVisible('income-breakdown', focus, visibleChartSet) &&
      overview ? (
        <ChartPanel
          title="Income breakdown"
          isLoading={dashboardQuery.isLoading}
        >
          <IncomeBreakdownChart
            range={overview.range}
            categories={overview.incomeBreakdown}
          />
        </ChartPanel>
      ) : null}

      {isDashboardChartVisible('post-performance', focus, visibleChartSet) ? (
        <ChartPanel
          title="Post performance map"
          subtitle="Payout × votes · bubble = comments"
          isLoading={dashboardQuery.isLoading}
        >
          {overview?.performancePosts.length ? (
            <PostPerformanceScatterChart posts={overview.performancePosts} />
          ) : (
            <EmptyStateMessage message="No rewarded posts were found for this period." />
          )}
        </ChartPanel>
      ) : null}

      {isDashboardChartVisible('payout-distribution', focus, visibleChartSet) ? (
        <ChartPanel
          title="Payout distribution"
          subtitle="Median and spread by period"
          isLoading={dashboardQuery.isLoading}
        >
          {overview?.payoutDistribution.some(
            (bucket) => bucket.rewards.length > 0,
          ) ? (
            <PayoutDistributionChart buckets={overview.payoutDistribution} />
          ) : (
            <EmptyStateMessage message="No paid posts were found for this period." />
          )}
        </ChartPanel>
      ) : null}

      {isDashboardChartVisible('community-breakdown', focus, visibleChartSet) ? (
        <ChartPanel
          title="Community reward breakdown"
          subtitle="Author rewards by community"
          isLoading={dashboardQuery.isLoading}
        >
          {overview?.communityRewardBreakdown.length ? (
            <CommunityRewardBreakdownChart
              communities={overview.communityRewardBreakdown}
            />
          ) : (
            <EmptyStateMessage message="No community-attributed author rewards were found for this period." />
          )}
        </ChartPanel>
      ) : null}

      {isDashboardChartVisible('hp-delegations', focus, visibleChartSet) &&
      overview?.outgoingDelegations.length ? (
        <ChartPanel
          title="Outgoing HP delegations"
          subtitle="Current split by delegatee"
          isLoading={dashboardQuery.isLoading}
        >
          <HpDelegationDonutChart
            account={account}
            delegations={overview.outgoingDelegations}
            ownHivePower={wallet?.metrics.hivePower ?? 0}
          />
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
                    Latest wallet and reward events
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
                  <EmptyStateMessage message="No recent account activity yet." />
                )}
              </Stack>
            </Card.Body>
          </Card.Root>
        ) : null}
      </SimpleGrid>
    </Stack>
  )
}

function Dashboard() {
  return <AccountAnalyticsPage />
}

function RewardIncomeChart({
  overview,
  focus,
}: {
  overview: DashboardHistoricalOverview | null
  focus: DashboardFocus
}) {
  if (!overview) {
    return <EmptyStateMessage message="No reward history yet." />
  }

  return (
    <Stack gap={3}>
      <RewardIncomeStackedChart buckets={overview.buckets} />
      <RewardIncomeHeatmapChart dailyIncome={overview.dailyIncome} />

      {(focus === 'publishing' || focus === 'all') && (
        <PublishingCadenceChart dailyPostCounts={overview.dailyPostCounts} />
      )}

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

function formatChangeLabel(change: number | null): string | undefined {
  if (change == null) return undefined
  const sign = change >= 0 ? '+' : ''
  return `${change >= 0 ? '↑' : '↓'} ${sign}${change.toFixed(1)}% vs prev period`
}

function formatFollowRatio(followers: number, following: number) {
  if (
    !Number.isFinite(followers) ||
    !Number.isFinite(following) ||
    following <= 0
  ) {
    return 'ratio —'
  }

  return `${(followers / following).toFixed(2)}x ratio`
}

function renderHivePowerCardBody(
  metrics: {
    hivePower: number
    receivedHivePower: number
    delegatedHivePower: number
    effectiveHivePower: number
    hivePriceHbd: number
  } | null,
) {
  if (!metrics) {
    return (
      <Text fontSize="xs" color="fg.muted">
        Owned stake
      </Text>
    )
  }

  const estimatedValue = metrics.effectiveHivePower * metrics.hivePriceHbd

  return (
    <Stack gap={1}>
      <HStack gap={2} wrap="wrap" fontSize="xs">
        <Text color="colorPalette.fg" fontWeight="600">
          {formatTokenAmount(metrics.hivePower, 0)} owned
        </Text>
        {metrics.receivedHivePower > 0 ? (
          <Text color="orange.fg" fontWeight="600">
            +{formatTokenAmount(metrics.receivedHivePower, 0)} in
          </Text>
        ) : null}
        {metrics.delegatedHivePower > 0 ? (
          <Text color="fg.muted" fontWeight="500">
            -{formatTokenAmount(metrics.delegatedHivePower, 0)} out
          </Text>
        ) : null}
      </HStack>
      <Text fontSize="2xs" color="fg.muted" fontFamily="mono">
        ~{formatTokenAmount(estimatedValue, 2)} HBD
      </Text>
    </Stack>
  )
}

function renderSavingsCardBody(
  savingsHbd: number | null,
  interestRatePercent: number | null,
) {
  if (
    savingsHbd == null ||
    !Number.isFinite(savingsHbd) ||
    interestRatePercent == null ||
    !Number.isFinite(interestRatePercent)
  ) {
    return (
      <Text fontSize="xs" color="fg.muted">
        Savings balance
      </Text>
    )
  }

  const apr = interestRatePercent / 100
  const monthlyPayout = (savingsHbd * apr) / 12
  const compoundedYearlyGain = savingsHbd * ((1 + apr / 12) ** 12 - 1)

  return (
    <Stack gap={1}>
      <HStack gap={2} wrap="wrap" fontSize="xs">
        <Text color="colorPalette.fg" fontWeight="600">
          {formatPercent(apr, 0)} APR
        </Text>
        <Text color="green.fg" fontWeight="600">
          +{formatTokenAmount(monthlyPayout, 2)}/mo
        </Text>
        <Text color="fg.muted" fontWeight="500">
          ~{formatTokenAmount(compoundedYearlyGain, 1)} HBD/year
        </Text>
      </HStack>
      <Text fontSize="2xs" color="fg.muted" fontFamily="mono">
        compound monthly
      </Text>
    </Stack>
  )
}

function formatPostingCadence(posts: number, range: DashboardRange) {
  const months =
    range === '1M' ? 1 : range === '3M' ? 3 : range === '6M' ? 6 : 12
  const perMonth = posts / months

  if (perMonth >= 1) {
    return `~${formatTokenAmount(perMonth, 1)}/mo`
  }

  const weeks =
    range === '1M' ? 4 : range === '3M' ? 13 : range === '6M' ? 26 : 52
  const perWeek = posts / weeks
  return `~${formatTokenAmount(perWeek, 1)}/wk`
}

function formatPublishingContext(
  publishedPosts: number | null,
  totalPosts: number | null,
  range: DashboardRange,
) {
  if (publishedPosts == null) {
    return 'From public Hive APIs'
  }

  const cadence = formatPostingCadence(publishedPosts, range)

  if (
    totalPosts != null &&
    Number.isFinite(totalPosts) &&
    totalPosts > 0 &&
    totalPosts >= publishedPosts
  ) {
    return `${publishedPosts} in ${rangeToDescription(range)} · ${formatPercent(publishedPosts / totalPosts, 0)} of lifetime`
  }

  return `${publishedPosts} in ${rangeToDescription(range)} · ${cadence}`
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

function formatAccountMilestone(value: string | null) {
  if (!value) {
    return 'On-chain account age'
  }

  const createdAt = new Date(value)
  if (Number.isNaN(createdAt.getTime())) {
    return 'On-chain account age'
  }

  const now = new Date()
  const nextAnniversaryYear =
    now >=
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        createdAt.getUTCMonth(),
        createdAt.getUTCDate(),
      ),
    )
      ? now.getUTCFullYear() + 1
      : now.getUTCFullYear()
  const nextAnniversary = new Date(
    Date.UTC(
      nextAnniversaryYear,
      createdAt.getUTCMonth(),
      createdAt.getUTCDate(),
    ),
  )
  const daysUntil = Math.max(
    0,
    Math.ceil(
      (nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    ),
  )
  const milestoneYears = nextAnniversaryYear - createdAt.getUTCFullYear()

  if (daysUntil <= 45) {
    return `${milestoneYears}y in ${daysUntil}d`
  }

  return `Turns ${milestoneYears} in ${nextAnniversary.toLocaleDateString(
    undefined,
    {
      month: 'short',
    },
  )}`
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
