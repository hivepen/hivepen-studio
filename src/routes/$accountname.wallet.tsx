import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Icon,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Stat,
  Table,
  Text,
} from '@chakra-ui/react'
import {
  Activity,
  Coins,
  ExternalLink,
  Gauge,
  PieChart,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Vote,
  WalletCards,
} from 'lucide-react'
import { useMemo } from 'react'
import type {
  HiveEngineBalance,
  HiveVestingDelegation,
  HiveWalletActivity,
  HiveWalletOverview,
} from '@/lib/hive/wallet'
import type { WalletColorPalette } from '@/features/wallet/walletAssets'
import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import useProfileQuery from '@/features/profile/useProfileQuery'
import {
  WalletAssetBadge,
  WalletAssetIcon,
  getWalletAssetMeta,
} from '@/features/wallet/walletAssets'
import useWalletQuery from '@/features/wallet/useWalletQuery'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { MAX_WITNESS_VOTES, vestsToHivePower } from '@/lib/hive/wallet'

export const Route = createFileRoute('/$accountname/wallet')({
  component: WalletPage,
})

type BalanceRow = {
  symbol: string
  label: string
  description: string
  amount: string
  estimate?: string
}

type MetricLineProps = {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
}

function WalletPage() {
  const { accountname } = Route.useParams()
  const username = accountname.replace(/^@/, '').toLowerCase()
  const profileQuery = useProfileQuery(username)
  const walletQuery = useWalletQuery(username)
  const wallet = walletQuery.data

  const balanceRows = useMemo(() => {
    if (!wallet) return []
    const { metrics } = wallet
    return [
      {
        symbol: 'HIVE',
        label: 'HIVE',
        description: 'Liquid HIVE',
        amount: formatTokenAmount(metrics.liquidHive, 'HIVE'),
        estimate: formatHbdEstimate(metrics.liquidHive * metrics.hivePriceHbd),
      },
      {
        symbol: 'HP',
        label: 'Hive Power',
        description: 'Owned staked HIVE',
        amount: formatTokenAmount(metrics.hivePower, 'HP'),
        estimate: formatHbdEstimate(metrics.hivePower * metrics.hivePriceHbd),
      },
      {
        symbol: 'HP',
        label: 'Delegated HP',
        description: 'Hive Power delegated out',
        amount: formatTokenAmount(metrics.delegatedHivePower, 'HP'),
      },
      {
        symbol: 'HP',
        label: 'Received HP',
        description: 'Hive Power delegated in',
        amount: formatTokenAmount(metrics.receivedHivePower, 'HP'),
      },
      {
        symbol: 'HBD',
        label: 'HBD',
        description: 'Liquid HBD',
        amount: formatTokenAmount(metrics.liquidHbd, 'HBD'),
        estimate: formatHbdEstimate(metrics.liquidHbd),
      },
      {
        symbol: 'HIVE',
        label: 'Savings HIVE',
        description: 'HIVE held in savings',
        amount: formatTokenAmount(metrics.savingsHive, 'HIVE'),
        estimate: formatHbdEstimate(metrics.savingsHive * metrics.hivePriceHbd),
      },
      {
        symbol: 'HBD',
        label: 'Savings HBD',
        description: `HBD savings at ${formatPercent(wallet.metrics.hbdInterestRate)}`,
        amount: formatTokenAmount(metrics.savingsHbd, 'HBD'),
        estimate: formatHbdEstimate(metrics.savingsHbd),
      },
      {
        symbol: 'HP',
        label: 'Rewards',
        description: 'Unclaimed HIVE, HBD, and HP rewards',
        amount: [
          formatTokenAmount(metrics.rewardHive, 'HIVE'),
          formatTokenAmount(metrics.rewardHbd, 'HBD'),
          formatTokenAmount(metrics.rewardHivePower, 'HP'),
        ].join(' + '),
      },
    ]
  }, [wallet])

  if (walletQuery.isLoading && !wallet) {
    return <WalletSkeleton username={username} />
  }

  if (walletQuery.isError) {
    return (
      <WalletPageFrame
        username={username}
        displayName={profileQuery.data?.displayName}
        profileImage={profileQuery.data?.profileImage}
      >
        <Alert status="error" title="Wallet unavailable">
          {walletQuery.error instanceof Error
            ? walletQuery.error.message
            : 'Unable to load this wallet right now.'}
        </Alert>
      </WalletPageFrame>
    )
  }

  if (!wallet) {
    return null
  }

  return (
    <WalletPageFrame
      username={username}
      displayName={profileQuery.data?.displayName}
      profileImage={profileQuery.data?.profileImage}
      isRefreshing={walletQuery.isFetching}
      onRefresh={() => walletQuery.refetch()}
      fetchedAt={wallet.fetchedAt}
    >
      <OverviewHero wallet={wallet} />
      <SummaryBand wallet={wallet} />

      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 360px' }}
        gap={5}
      >
        <Stack gap={5} minW={0}>
          <BalancesTable rows={balanceRows} />
          <ActivityTable activity={wallet.activity} />
        </Stack>

        <Stack gap={5} minW={0}>
          <ResourcesPanel wallet={wallet} />
          <WalletSignalsPanel wallet={wallet} />
          <DelegationsPanel wallet={wallet} />
        </Stack>
      </Grid>

      <HiveEngineTable balances={wallet.hiveEngineBalances} />
    </WalletPageFrame>
  )
}

function WalletPageFrame({
  username,
  displayName,
  profileImage,
  isRefreshing,
  onRefresh,
  fetchedAt,
  children,
}: {
  username: string
  displayName?: string
  profileImage?: string
  isRefreshing?: boolean
  onRefresh?: () => void
  fetchedAt?: number
  children: React.ReactNode
}) {
  return (
    <Stack gap={6} p={{ base: 4, md: 6 }} maxW="1180px" mx="auto" w="full">
      <HStack justify="space-between" align="start" gap={4} wrap="wrap">
        <HStack gap={4} minW={0}>
          <Avatar
            size="lg"
            src={profileImage ?? getHiveAvatarUrl(username)}
            name={displayName ?? username}
          />
          <Stack gap={1} minW={0}>
            <Heading size="lg" lineHeight="1.15">
              {displayName || `@${username}`}
            </Heading>
            <HStack gap={2} wrap="wrap" color="fg.muted" fontSize="sm">
              <Text>@{username}</Text>
              <Text>Wallet</Text>
              {fetchedAt ? <Text>{formatUpdatedAt(fetchedAt)}</Text> : null}
            </HStack>
          </Stack>
        </HStack>

        <HStack gap={2} wrap="wrap" justify="flex-end">
          {onRefresh ? (
            <Button
              variant="subtle"
              colorPalette="gray"
              loading={isRefreshing}
              onClick={onRefresh}
            >
              <Icon as={RefreshCw} />
              Refresh
            </Button>
          ) : null}
          <Button asChild variant="subtle" colorPalette="gray">
            <a
              href={`https://hiveblocks.com/@${username}`}
              target="_blank"
              rel="noreferrer"
            >
              <Icon as={ExternalLink} />
              Hiveblocks
            </a>
          </Button>
        </HStack>
      </HStack>
      {children}
    </Stack>
  )
}

function OverviewHero({ wallet }: { wallet: HiveWalletOverview }) {
  const { account, metrics } = wallet
  const liquidValue =
    metrics.liquidHbd +
    estimateHiveValue(metrics.liquidHive, metrics.hivePriceHbd)
  const savingsValue =
    metrics.savingsHbd +
    estimateHiveValue(metrics.savingsHive, metrics.hivePriceHbd)
  const stakedValue = estimateHiveValue(metrics.hivePower, metrics.hivePriceHbd)
  const rewardsValue =
    metrics.rewardHbd +
    estimateHiveValue(
      metrics.rewardHive + metrics.rewardHivePower,
      metrics.hivePriceHbd,
    )
  const mixItems = [
    {
      label: 'Liquid reserves',
      value: liquidValue,
      detail: [
        formatTokenAmount(metrics.liquidHive, 'HIVE'),
        formatTokenAmount(metrics.liquidHbd, 'HBD'),
      ].join(' + '),
      palette: 'red' as const,
    },
    {
      label: 'Savings parked',
      value: savingsValue,
      detail: `${formatTokenAmount(metrics.savingsHbd, 'HBD')} at ${formatPercent(metrics.hbdInterestRate)}`,
      palette: 'green' as const,
    },
    {
      label: 'Owned stake',
      value: stakedValue,
      detail: `${formatTokenAmount(metrics.hivePower, 'HP')} owned`,
      palette: 'purple' as const,
    },
    {
      label: 'Pending rewards',
      value: rewardsValue,
      detail:
        rewardsValue > 0
          ? [
              formatTokenAmount(metrics.rewardHive, 'HIVE'),
              formatTokenAmount(metrics.rewardHbd, 'HBD'),
              formatTokenAmount(metrics.rewardHivePower, 'HP'),
            ].join(' + ')
          : 'Nothing waiting to be claimed',
      palette: 'orange' as const,
    },
  ]
  const dominantMix = [...mixItems].sort(
    (left, right) => right.value - left.value,
  )[0]
  const powerDownRate = vestsToHivePower(
    account.vesting_withdraw_rate,
    wallet.dynamicGlobalProperties,
  )

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        xl: 'minmax(0, 1.35fr) minmax(320px, 0.85fr)',
      }}
      gap={4}
    >
      <SectionPanel colorPalette="red" title="Overview" accentSymbol="HIVE">
        <Stack gap={4}>
          <HStack align="start" justify="space-between" gap={4} wrap="wrap">
            <Stack gap={1}>
              <Heading size="2xl" lineHeight="0.95" letterSpacing="-0.03em">
                {formatHbdEstimate(metrics.estimatedHbdValue)}
              </Heading>
              <Text color="fg" fontSize="sm">
                @{wallet.username} wallet
              </Text>
            </Stack>
            <HStack gap={2} wrap="wrap">
              <Badge colorPalette="gray" variant="subtle">
                {dominantMix.label}
              </Badge>
              <Badge colorPalette="gray" variant="subtle">
                {wallet.hiveEngineBalances.length} engine
              </Badge>
              {powerDownRate > 0 ? (
                <Badge colorPalette="gray" variant="subtle">
                  Power down active
                </Badge>
              ) : null}
            </HStack>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
            <HeroMetricCard
              colorPalette="gray"
              icon={WalletCards}
              label="Liquid"
              value={formatHbdEstimate(liquidValue)}
              detail={`${formatNumber(safePercent(liquidValue, metrics.estimatedHbdValue), 1)}%`}
            />
            <HeroMetricCard
              colorPalette="gray"
              icon={ShieldCheck}
              label="Effective HP"
              value={formatTokenAmount(metrics.effectiveHivePower, 'HP')}
              detail={formatTokenAmount(metrics.delegatedHivePower, 'HP')}
            />
            <HeroMetricCard
              colorPalette="gray"
              icon={Sparkles}
              label="Savings"
              value={formatTokenAmount(metrics.savingsHbd, 'HBD')}
              detail={`APR ${formatPercent(metrics.hbdInterestRate)}`}
            />
          </SimpleGrid>
        </Stack>
      </SectionPanel>

      <SectionPanel colorPalette="red" title="Mix" accentSymbol="ENGINE">
        <Stack gap={3}>
          {mixItems.map((item) => (
            <PortfolioMixRow
              key={item.label}
              colorPalette="gray"
              label={item.label}
              value={item.value}
              detail={item.detail}
              share={safePercent(item.value, metrics.estimatedHbdValue)}
            />
          ))}
        </Stack>
      </SectionPanel>
    </Grid>
  )
}

function SummaryBand({ wallet }: { wallet: HiveWalletOverview }) {
  const { metrics } = wallet

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 3, md: 4 }}>
      <CompactStat
        label="Liquid"
        value={formatHbdEstimate(
          estimateHiveValue(metrics.liquidHive, metrics.hivePriceHbd) +
            metrics.liquidHbd,
        )}
        help={formatTokenAmount(metrics.liquidHive, 'HIVE')}
        icon={WalletCards}
        palette="gray"
        symbol="HIVE"
      />
      <CompactStat
        label="HP"
        value={formatTokenAmount(metrics.effectiveHivePower, 'HP')}
        help={formatTokenAmount(metrics.hivePower, 'HP')}
        icon={ShieldCheck}
        palette="gray"
        symbol="HP"
      />
      <CompactStat
        label="Savings"
        value={formatTokenAmount(metrics.savingsHbd, 'HBD')}
        help={formatPercent(metrics.hbdInterestRate)}
        icon={Coins}
        palette="gray"
        symbol="HBD"
      />
      <CompactStat
        label="RC"
        value={formatNullablePercent(metrics.rcPercent)}
        help={formatCompactRc(wallet.rcAccount?.max_rc)}
        icon={Activity}
        palette="gray"
        symbol="RC"
      />
    </SimpleGrid>
  )
}

function CompactStat({
  label,
  value,
  help,
  icon,
  palette,
  symbol,
}: {
  label: string
  value: string
  help: string
  icon: typeof WalletCards
  palette: WalletColorPalette | 'gray'
  symbol: string
}) {
  return (
    <Stat.Root
      bg="bg.panel"
      border="1px solid"
      borderColor="border"
      borderRadius="16px"
      colorPalette={palette}
      gap={3}
      justifyContent="space-between"
      minH="116px"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 4 }}
    >
      <HStack align="start" justify="space-between">
        <Stack gap={1}>
          <Stat.Label color="fg.muted">{label}</Stat.Label>
          <Badge
            alignSelf="start"
            colorPalette="gray"
            fontWeight="500"
            size="sm"
            variant="subtle"
          >
            {getWalletAssetMeta(symbol).label}
          </Badge>
        </Stack>
        <Box
          alignItems="center"
          bg="bg.muted"
          border="1px solid"
          borderColor="border"
          borderRadius="full"
          color="fg.muted"
          display="inline-flex"
          justifyContent="center"
          p="2"
        >
          <Icon as={icon} boxSize={4} />
        </Box>
      </HStack>
      <Stat.ValueText fontSize={{ base: '2xl', md: '3xl' }} lineHeight="1.05">
        {value}
      </Stat.ValueText>
      <Stat.HelpText color="fg">{help}</Stat.HelpText>
    </Stat.Root>
  )
}

function BalancesTable({ rows }: { rows: Array<BalanceRow> }) {
  return (
    <SectionPanel colorPalette="gray" title="Balances" accentSymbol="HIVE">
      <Table.ScrollArea>
        <Table.Root size="sm" minW="620px">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Asset</Table.ColumnHeader>
              <Table.ColumnHeader>Scope</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Estimate</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.label}>
                <Table.Cell>
                  <WalletAssetBadge symbol={row.symbol} label={row.label} />
                </Table.Cell>
                <Table.Cell color="fg">{row.description}</Table.Cell>
                <Table.Cell textAlign="end" whiteSpace="nowrap">
                  {row.amount}
                </Table.Cell>
                <Table.Cell textAlign="end" color="fg" whiteSpace="nowrap">
                  {row.estimate ?? '—'}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </SectionPanel>
  )
}

function ResourcesPanel({ wallet }: { wallet: HiveWalletOverview }) {
  const { account, metrics, rcAccount } = wallet
  const witnessCount = account.witness_votes?.length ?? 0

  return (
    <SectionPanel colorPalette="gray" title="Resources" accentSymbol="RC">
      <Stack gap={4}>
        <ResourceMeter
          label="Voting mana"
          value={metrics.votingManaPercent}
          valueText={formatNullablePercent(metrics.votingManaPercent)}
        />
        <ResourceMeter
          label="Downvote mana"
          value={metrics.downvoteManaPercent}
          valueText={formatNullablePercent(metrics.downvoteManaPercent)}
        />
        <ResourceMeter
          label="Resource credits"
          value={metrics.rcPercent}
          valueText={formatNullablePercent(metrics.rcPercent)}
        />
        <MetricLine
          label="RC delegated"
          value={formatCompactRc(rcAccount?.delegated_rc)}
          detail={`${formatCompactRc(rcAccount?.received_delegated_rc)} received`}
        />
        <MetricLine
          label="Witness votes"
          value={`${witnessCount} / ${MAX_WITNESS_VOTES}`}
          detail={
            account.proxy
              ? `Proxy: @${account.proxy}`
              : `${MAX_WITNESS_VOTES - witnessCount} remaining`
          }
        />
        <MetricLine
          label="HBD savings APR"
          value={formatPercent(metrics.hbdInterestRate)}
        />
        <MetricLine
          label="Savings withdrawals"
          value={String(account.savings_withdraw_requests ?? 0)}
        />
        {account.created ? (
          <MetricLine label="Created" value={formatDate(account.created)} />
        ) : null}
      </Stack>
    </SectionPanel>
  )
}

function WalletSignalsPanel({ wallet }: { wallet: HiveWalletOverview }) {
  const { account, activity, metrics } = wallet
  const witnessCount = account.witness_votes?.length ?? 0
  const delegatedShare =
    metrics.hivePower > 0
      ? safePercent(metrics.delegatedHivePower, metrics.hivePower)
      : 0
  const rewardValue =
    metrics.rewardHbd +
    estimateHiveValue(
      metrics.rewardHive + metrics.rewardHivePower,
      metrics.hivePriceHbd,
    )
  const powerDownRate = vestsToHivePower(
    account.vesting_withdraw_rate,
    wallet.dynamicGlobalProperties,
  )
  const lastActivity = activity.at(0)

  return (
    <SectionPanel colorPalette="gray" title="Signals" accentSymbol="ENGINE">
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        <SignalTile
          colorPalette="gray"
          icon={PieChart}
          label="Delegated out"
          value={`${formatNumber(delegatedShare, 1)}%`}
          detail={formatTokenAmount(metrics.delegatedHivePower, 'HP')}
        />
        <SignalTile
          colorPalette="green"
          icon={Sparkles}
          label="Pending rewards"
          value={rewardValue > 0 ? formatHbdEstimate(rewardValue) : 'Clear'}
          detail={rewardValue > 0 ? 'Rewards pending' : 'Clear'}
        />
        <SignalTile
          colorPalette="gray"
          icon={Vote}
          label="Witness reach"
          value={`${witnessCount} / ${MAX_WITNESS_VOTES}`}
          detail={
            account.proxy
              ? `Proxy @${account.proxy}`
              : `${MAX_WITNESS_VOTES - witnessCount} open`
          }
        />
        <SignalTile
          colorPalette="gray"
          icon={Gauge}
          label="Power down"
          value={
            powerDownRate > 0
              ? formatTokenAmount(powerDownRate, 'HP')
              : 'Inactive'
          }
          detail={
            powerDownRate > 0
              ? formatDate(account.next_vesting_withdrawal)
              : 'Not active'
          }
        />
        <SignalTile
          colorPalette="gray"
          icon={Activity}
          label="Last activity"
          value={
            lastActivity ? formatActivityType(lastActivity.type) : 'No activity'
          }
          detail={
            lastActivity
              ? `${formatDate(lastActivity.timestamp)}`
              : 'No recent activity'
          }
        />
        <SignalTile
          colorPalette="orange"
          icon={Coins}
          label="Sidechain footprint"
          value={String(wallet.hiveEngineBalances.length)}
          detail="Balances"
        />
      </SimpleGrid>
    </SectionPanel>
  )
}

function MetricLine({ label, value, detail }: MetricLineProps) {
  return (
    <HStack justify="space-between" gap={4} align="start">
      <Stack gap={0} minW={0}>
        <Text fontSize="sm" color="fg.muted">
          {label}
        </Text>
        {detail ? (
          <Text fontSize="xs" color="fg.muted">
            {detail}
          </Text>
        ) : null}
      </Stack>
      <Text color="fg" fontSize="sm" fontWeight="600" textAlign="end">
        {value}
      </Text>
    </HStack>
  )
}

function ResourceMeter({
  label,
  value,
  valueText,
  detail,
}: {
  detail?: string
  label: string
  value: number | null
  valueText: string
}) {
  return (
    <Box>
      <Stack gap={2.5}>
        <HStack justify="space-between" gap={3}>
          <Stack gap={0.5}>
            <Text color="fg" fontSize="sm" fontWeight="600">
              {label}
            </Text>
            {detail ? (
              <Text color="fg.muted" fontSize="xs">
                {detail}
              </Text>
            ) : null}
          </Stack>
          <Text color="fg" fontSize="sm" fontWeight="700">
            {valueText}
          </Text>
        </HStack>
        <Progress.Root
          colorPalette="gray"
          size="sm"
          value={value === null ? 0 : clampPercent(value)}
          variant="subtle"
        >
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Stack>
    </Box>
  )
}

function DelegationsPanel({ wallet }: { wallet: HiveWalletOverview }) {
  const totalDelegated = wallet.outgoingDelegations.reduce(
    (sum, delegation) => {
      return (
        sum +
        vestsToHivePower(
          delegation.vesting_shares,
          wallet.dynamicGlobalProperties,
        )
      )
    },
    0,
  )

  return (
    <SectionPanel colorPalette="gray" title="Delegations" accentSymbol="HP">
      {wallet.outgoingDelegations.length > 0 ? (
        <Stack gap={3}>
          <HStack
            bg="bg.muted"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            justify="space-between"
            px={3.5}
            py={3}
          >
            <Stack gap={0.5}>
              <Text color="fg" fontSize="sm" fontWeight="600">
                {wallet.outgoingDelegations.length} active delegates
              </Text>
              <Text color="fg.muted" fontSize="xs">
                {formatNumber(
                  safePercent(totalDelegated, wallet.metrics.hivePower),
                  1,
                )}
                % of owned Hive Power is delegated out
              </Text>
            </Stack>
            <Text color="fg" fontSize="sm" fontWeight="700">
              {formatTokenAmount(totalDelegated, 'HP')}
            </Text>
          </HStack>
          {wallet.outgoingDelegations.map((delegation) => (
            <DelegationRow
              key={`${delegation.delegatee}-${delegation.vesting_shares}`}
              delegation={delegation}
              wallet={wallet}
            />
          ))}
        </Stack>
      ) : (
        <Text color="fg.muted" fontSize="sm">
          No outgoing Hive Power delegations.
        </Text>
      )}
    </SectionPanel>
  )
}

function DelegationRow({
  delegation,
  wallet,
}: {
  delegation: HiveVestingDelegation
  wallet: HiveWalletOverview
}) {
  const hp = vestsToHivePower(
    delegation.vesting_shares,
    wallet.dynamicGlobalProperties,
  )

  return (
    <HStack justify="space-between" gap={4} align="start">
      <Stack gap={0} minW={0}>
        <Text color="fg" fontSize="sm" fontWeight="600">
          @{delegation.delegatee}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {formatDate(delegation.min_delegation_time)}
        </Text>
      </Stack>
      <Text color="fg" fontSize="sm" fontWeight="600" whiteSpace="nowrap">
        {formatTokenAmount(hp, 'HP')}
      </Text>
    </HStack>
  )
}

function HiveEngineTable({ balances }: { balances: Array<HiveEngineBalance> }) {
  return (
    <SectionPanel colorPalette="gray" title="Hive Engine" accentSymbol="ENGINE">
      {balances.length > 0 ? (
        <Table.ScrollArea>
          <Table.Root size="sm" minW="620px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Token</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Liquid</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Staked</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Delegated
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {balances.map((balance) => (
                <Table.Row key={balance.symbol}>
                  <Table.Cell>
                    <WalletAssetBadge symbol={balance.symbol} />
                  </Table.Cell>
                  <Table.Cell color="fg" textAlign="end">
                    {formatEngineAmount(balance.balance)}
                  </Table.Cell>
                  <Table.Cell color="fg" textAlign="end">
                    {formatEngineAmount(balance.stake)}
                  </Table.Cell>
                  <Table.Cell textAlign="end" color="fg.muted">
                    {formatEngineDelegations(balance)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <Text color="fg.muted" fontSize="sm">
          No Hive Engine balances found.
        </Text>
      )}
    </SectionPanel>
  )
}

function ActivityTable({ activity }: { activity: Array<HiveWalletActivity> }) {
  return (
    <SectionPanel colorPalette="gray" title="Activity" accentSymbol="ENGINE">
      {activity.length > 0 ? (
        <Table.ScrollArea>
          <Table.Root size="sm" minW="760px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Time</Table.ColumnHeader>
                <Table.ColumnHeader>Operation</Table.ColumnHeader>
                <Table.ColumnHeader>Detail</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {activity.map((entry) => (
                <Table.Row key={entry.id}>
                  <Table.Cell color="fg.muted" whiteSpace="nowrap">
                    {formatDate(entry.timestamp)}
                  </Table.Cell>
                  <Table.Cell fontWeight="600" whiteSpace="nowrap">
                    {formatActivityType(entry.type)}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">{entry.description}</Table.Cell>
                  <Table.Cell textAlign="end" whiteSpace="nowrap">
                    {entry.amount || '—'}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <Text color="fg.muted" fontSize="sm">
          No recent activity found.
        </Text>
      )}
    </SectionPanel>
  )
}

function HeroMetricCard({
  colorPalette,
  detail,
  icon,
  label,
  value,
}: {
  colorPalette: WalletColorPalette | 'gray'
  detail: string
  icon: typeof WalletCards
  label: string
  value: string
}) {
  return (
    <Box
      bg="bg.panel"
      border="1px solid"
      borderColor="border"
      borderRadius="16px"
      colorPalette={colorPalette}
      minH="102px"
      px={4}
      py={3.5}
    >
      <Stack gap={3} h="full" justify="space-between">
        <HStack justify="space-between" align="start">
          <Text color="fg.muted" fontSize="sm" fontWeight="600">
            {label}
          </Text>
          <Box
            alignItems="center"
            bg="bg.muted"
            borderRadius="full"
            color="fg.muted"
            display="inline-flex"
            justifyContent="center"
            p="1.5"
          >
            <Icon as={icon} boxSize={4} />
          </Box>
        </HStack>
        <Stack gap={0.5}>
          <Text
            color="fg"
            fontSize={{ base: 'xl', md: '2xl' }}
            fontWeight="800"
            lineHeight="1.05"
          >
            {value}
          </Text>
          <Text color="fg" fontSize="sm">
            {detail}
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}

function PortfolioMixRow({
  colorPalette,
  detail,
  label,
  share,
  value,
}: {
  colorPalette: WalletColorPalette | 'gray'
  detail: string
  label: string
  share: number
  value: number
}) {
  return (
    <Box>
      <HStack justify="space-between" gap={4} mb={2}>
        <Stack gap={0.5}>
          <Text color="fg" fontSize="sm" fontWeight="600">
            {label}
          </Text>
          <Text color="fg.muted" fontSize="xs">
            {detail}
          </Text>
        </Stack>
        <Stack gap={0.5} align="end">
          <Text color="fg" fontSize="sm" fontWeight="700">
            {formatHbdEstimate(value)}
          </Text>
          <Text color="fg.muted" fontSize="xs">
            {formatNumber(share, 1)}%
          </Text>
        </Stack>
      </HStack>
      <Progress.Root
        colorPalette="gray"
        size="sm"
        value={clampPercent(share)}
        variant="subtle"
      >
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  )
}

function SignalTile({
  colorPalette,
  detail,
  icon,
  label,
  value,
}: {
  colorPalette: WalletColorPalette | 'gray'
  detail: string
  icon: typeof WalletCards
  label: string
  value: string
}) {
  return (
    <Box
      bg="bg.panel"
      border="1px solid"
      borderColor="border"
      borderRadius="14px"
      colorPalette={colorPalette}
      px={3.5}
      py={3}
    >
      <Stack gap={2.5}>
        <HStack justify="space-between" gap={3} align="start">
          <Text color="fg.muted" fontSize="sm" fontWeight="600">
            {label}
          </Text>
          <Icon as={icon} boxSize={4} color="colorPalette.solid" />
        </HStack>
        <Text
          color="fg"
          fontSize={{ base: 'md', md: 'lg' }}
          fontWeight="800"
          lineHeight="1.1"
        >
          {value}
        </Text>
        <Text color="fg" fontSize="xs">
          {detail}
        </Text>
      </Stack>
    </Box>
  )
}

function SectionPanel({
  colorPalette,
  title,
  accentSymbol,
  description,
  children,
}: {
  colorPalette: WalletColorPalette | 'gray'
  title: string
  accentSymbol?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Box
      bg="bg.panel"
      border="1px solid"
      borderColor="border"
      borderRadius="16px"
      colorPalette={colorPalette}
      p={{ base: 4, md: 5 }}
    >
      <Stack gap={4}>
        <HStack justify="space-between" align="start" gap={3} wrap="wrap">
          <Stack gap={1}>
            <HStack gap={3}>
              {accentSymbol ? (
                <WalletAssetIcon symbol={accentSymbol} size="8" />
              ) : null}
              <Heading color="fg" size="sm">
                {title}
              </Heading>
            </HStack>
            {description ? (
              <Text color="fg.muted" fontSize="sm">
                {description}
              </Text>
            ) : null}
          </Stack>
        </HStack>
        {children}
      </Stack>
    </Box>
  )
}

function WalletSkeleton({ username }: { username: string }) {
  return (
    <WalletPageFrame username={username}>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} h="132px" borderRadius="16px" />
        ))}
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} h="172px" borderRadius="16px" />
        ))}
      </SimpleGrid>
      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 360px' }}
        gap={5}
      >
        <Stack gap={5}>
          <Skeleton h="340px" borderRadius="12px" />
          <Skeleton h="420px" borderRadius="12px" />
        </Stack>
        <Stack gap={5}>
          <Skeleton h="320px" borderRadius="12px" />
          <Skeleton h="220px" borderRadius="12px" />
        </Stack>
      </Grid>
    </WalletPageFrame>
  )
}

const formatNumber = (value: number, maximumFractionDigits = 3) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0)

const formatTokenAmount = (value: number, symbol: string) =>
  `${formatNumber(value, 3)} ${symbol}`

const formatHbdEstimate = (value: number) => `$${formatNumber(value, 3)} HBD`

const formatPercent = (value: number) => `${formatNumber(value, 2)}%`

const formatNullablePercent = (value: number | null) =>
  value === null ? '—' : formatPercent(value)

const formatUpdatedAt = (value: number) => `Updated ${formatDate(value)}`

const formatDate = (value: string | number) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatCompactRc = (value?: number | string) => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  if (!Number.isFinite(parsed) || parsed <= 0) return '0 RC'
  return `${new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(parsed)} RC`
}

const formatEngineAmount = (value: string) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  if (parsed === 0) return '0'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: parsed < 1 ? 8 : 3,
  }).format(parsed)
}

const formatEngineDelegations = (balance: HiveEngineBalance) => {
  const incoming = Number(balance.delegationsIn)
  const outgoing = Number(balance.delegationsOut)
  const parts = []
  if (Number.isFinite(incoming) && incoming > 0) {
    parts.push(`${formatEngineAmount(balance.delegationsIn)} in`)
  }
  if (Number.isFinite(outgoing) && outgoing > 0) {
    parts.push(`${formatEngineAmount(balance.delegationsOut)} out`)
  }
  return parts.length > 0 ? parts.join(' / ') : '—'
}

const estimateHiveValue = (value: number, hivePriceHbd: number) =>
  value * hivePriceHbd

const safePercent = (value: number, total: number) =>
  total > 0 ? (value / total) * 100 : 0

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const formatActivityType = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
