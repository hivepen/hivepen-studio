import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Icon,
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
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import { useMemo } from 'react'
import type {
  HiveEngineBalance,
  HiveVestingDelegation,
  HiveWalletActivity,
  HiveWalletOverview,
} from '@/lib/hive/wallet'
import type {WalletColorPalette} from '@/features/wallet/walletAssets';
import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import useProfileQuery from '@/features/profile/useProfileQuery'
import {
  WalletAssetBadge,
  WalletAssetIcon,
  
  getWalletAssetMeta
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
      <SummaryBand wallet={wallet} />
      <AssetHighlights wallet={wallet} />

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
              colorPalette="red"
              loading={isRefreshing}
              onClick={onRefresh}
            >
              <Icon as={RefreshCw} />
              Refresh
            </Button>
          ) : null}
          <Button asChild variant="subtle" colorPalette="orange">
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

function SummaryBand({ wallet }: { wallet: HiveWalletOverview }) {
  const { metrics } = wallet

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: 3, md: 4 }}>
      <CompactStat
        label="Estimated value"
        value={formatHbdEstimate(metrics.estimatedHbdValue)}
        help={`HIVE at ${formatHbdEstimate(metrics.hivePriceHbd)}`}
        icon={WalletCards}
        palette="red"
        symbol="HIVE"
      />
      <CompactStat
        label="Hive Power"
        value={formatTokenAmount(metrics.hivePower, 'HP')}
        help={`${formatTokenAmount(metrics.effectiveHivePower, 'HP')} effective`}
        icon={ShieldCheck}
        palette="purple"
        symbol="HP"
      />
      <CompactStat
        label="Savings"
        value={formatTokenAmount(metrics.savingsHbd, 'HBD')}
        help={`${formatTokenAmount(metrics.savingsHive, 'HIVE')} saved`}
        icon={Coins}
        palette="green"
        symbol="HBD"
      />
      <CompactStat
        label="Resource credits"
        value={formatNullablePercent(metrics.rcPercent)}
        help="Available RC"
        icon={Activity}
        palette="blue"
        symbol="RC"
      />
    </SimpleGrid>
  )
}

function AssetHighlights({ wallet }: { wallet: HiveWalletOverview }) {
  const { metrics } = wallet

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
      <SectionPanel
        colorPalette="red"
        title="Core assets"
        accentSymbol="HIVE"
        description="Public balances available on-chain right now."
      >
        <Stack gap={3}>
          <AssetMetricTile
            symbol="HIVE"
            label="Liquid + savings"
            value={formatTokenAmount(
              metrics.liquidHive + metrics.savingsHive,
              'HIVE',
            )}
            detail={formatHbdEstimate(
              (metrics.liquidHive + metrics.savingsHive) * metrics.hivePriceHbd,
            )}
          />
          <AssetMetricTile
            symbol="HBD"
            label="Liquid + savings"
            value={formatTokenAmount(
              metrics.liquidHbd + metrics.savingsHbd,
              'HBD',
            )}
            detail={`APR ${formatPercent(metrics.hbdInterestRate)}`}
          />
        </Stack>
      </SectionPanel>
      <SectionPanel
        colorPalette="purple"
        title="Powered stake"
        accentSymbol="HP"
        description="Ownership, delegation, and governance weight."
      >
        <Stack gap={3}>
          <AssetMetricTile
            symbol="HP"
            label="Effective Hive Power"
            value={formatTokenAmount(metrics.effectiveHivePower, 'HP')}
            detail={`${formatTokenAmount(metrics.receivedHivePower, 'HP')} received`}
          />
          <AssetMetricTile
            symbol="HP"
            label="Delegated out"
            value={formatTokenAmount(metrics.delegatedHivePower, 'HP')}
            detail={`${formatTokenAmount(metrics.hivePower, 'HP')} owned`}
          />
        </Stack>
      </SectionPanel>
      <SectionPanel
        colorPalette="orange"
        title="Activity edge"
        accentSymbol="ENGINE"
        description="A quick read on rewards, RC, and side balances."
      >
        <Stack gap={3}>
          <AssetMetricTile
            symbol="RC"
            label="Resource credits"
            value={formatNullablePercent(metrics.rcPercent)}
            detail={formatCompactRc(wallet.rcAccount?.max_rc)}
          />
          <AssetMetricTile
            symbol="ENGINE"
            label="Hive Engine tokens"
            value={String(wallet.hiveEngineBalances.length)}
            detail="Distinct balances"
          />
        </Stack>
      </SectionPanel>
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
  palette: WalletColorPalette
  symbol: string
}) {
  return (
    <Stat.Root
      bg="colorPalette.subtle"
      border="1px solid"
      borderColor="colorPalette.muted"
      borderRadius="16px"
      colorPalette={palette}
      gap={4}
      justifyContent="space-between"
      minH="132px"
      px={{ base: 4, md: 5 }}
      py={{ base: 4, md: 4.5 }}
    >
      <HStack align="start" justify="space-between">
        <Stack gap={1}>
          <Stat.Label color="colorPalette.fg">{label}</Stat.Label>
          <Badge
            alignSelf="start"
            colorPalette={palette}
            fontWeight="600"
            size="sm"
            variant="subtle"
          >
            {getWalletAssetMeta(symbol).label}
          </Badge>
        </Stack>
        <Box
          alignItems="center"
          bg="bg.panel"
          border="1px solid"
          borderColor="colorPalette.muted"
          borderRadius="full"
          color="colorPalette.fg"
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
      <Stat.HelpText color="colorPalette.muted">{help}</Stat.HelpText>
    </Stat.Root>
  )
}

function AssetMetricTile({
  symbol,
  label,
  value,
  detail,
}: {
  symbol: string
  label: string
  value: string
  detail: string
}) {
  const asset = getWalletAssetMeta(symbol)

  return (
    <HStack
      align="start"
      bg="colorPalette.subtle"
      border="1px solid"
      borderColor="colorPalette.muted"
      borderRadius="14px"
      colorPalette={asset.colorPalette}
      justify="space-between"
      p={3}
      gap={4}
    >
      <WalletAssetBadge symbol={symbol} label={label} />
      <Stack gap={0.5} textAlign="end">
        <Text
          color="colorPalette.fg"
          fontSize="lg"
          fontWeight="700"
          lineHeight="1.1"
        >
          {value}
        </Text>
        <Text color="colorPalette.muted" fontSize="sm">
          {detail}
        </Text>
      </Stack>
    </HStack>
  )
}

function BalancesTable({ rows }: { rows: Array<BalanceRow> }) {
  return (
    <SectionPanel
      colorPalette="red"
      title="Balances"
      accentSymbol="HIVE"
      description="Liquid, savings, stake, and pending rewards."
    >
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
                <Table.Cell color="fg.muted">{row.description}</Table.Cell>
                <Table.Cell textAlign="end" whiteSpace="nowrap">
                  {row.amount}
                </Table.Cell>
                <Table.Cell
                  textAlign="end"
                  color="fg.muted"
                  whiteSpace="nowrap"
                >
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
    <SectionPanel
      colorPalette="blue"
      title="Resources"
      accentSymbol="RC"
      description="Voting power, witness capacity, and savings settings."
    >
      <Stack gap={4}>
        <MetricLine
          label="Voting mana"
          value={formatNullablePercent(metrics.votingManaPercent)}
        />
        <MetricLine
          label="Downvote mana"
          value={formatNullablePercent(metrics.downvoteManaPercent)}
        />
        <MetricLine
          label="Resource credits"
          value={formatNullablePercent(metrics.rcPercent)}
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

function MetricLine({ label, value, detail }: MetricLineProps) {
  return (
    <HStack justify="space-between" gap={4} align="start">
      <Stack gap={0} minW={0}>
        <Text fontSize="sm" color="colorPalette.muted">
          {label}
        </Text>
        {detail ? (
          <Text fontSize="xs" color="fg.subtle">
            {detail}
          </Text>
        ) : null}
      </Stack>
      <Text
        color="colorPalette.fg"
        fontSize="sm"
        fontWeight="600"
        textAlign="end"
      >
        {value}
      </Text>
    </HStack>
  )
}

function DelegationsPanel({ wallet }: { wallet: HiveWalletOverview }) {
  return (
    <SectionPanel
      colorPalette="purple"
      title="Outgoing HP"
      accentSymbol="HP"
      description="Stake currently delegated to other Hive accounts."
    >
      {wallet.outgoingDelegations.length > 0 ? (
        <Stack gap={3}>
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
        <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
          @{delegation.delegatee}
        </Text>
        <Text fontSize="xs" color="colorPalette.muted">
          Available after {formatDate(delegation.min_delegation_time)}
        </Text>
      </Stack>
      <Text
        color="colorPalette.fg"
        fontSize="sm"
        fontWeight="600"
        whiteSpace="nowrap"
      >
        {formatTokenAmount(hp, 'HP')}
      </Text>
    </HStack>
  )
}

function HiveEngineTable({ balances }: { balances: Array<HiveEngineBalance> }) {
  return (
    <SectionPanel
      colorPalette="orange"
      title="Hive Engine"
      accentSymbol="ENGINE"
      description="Public sidechain balances from Tribaldex token metadata."
    >
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
                  <Table.Cell color="colorPalette.fg" textAlign="end">
                    {formatEngineAmount(balance.balance)}
                  </Table.Cell>
                  <Table.Cell color="colorPalette.fg" textAlign="end">
                    {formatEngineAmount(balance.stake)}
                  </Table.Cell>
                  <Table.Cell textAlign="end" color="colorPalette.muted">
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
    <SectionPanel
      colorPalette="orange"
      title="Recent activity"
      accentSymbol="ENGINE"
      description="The last public wallet and governance operations we can read."
    >
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

function SectionPanel({
  colorPalette,
  title,
  accentSymbol,
  description,
  children,
}: {
  colorPalette: WalletColorPalette
  title: string
  accentSymbol?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Box
      bg="bg.panel"
      border="1px solid"
      borderColor="colorPalette.muted"
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
              <Heading color="colorPalette.fg" size="sm">
                {title}
              </Heading>
            </HStack>
            {description ? (
              <Text color="colorPalette.muted" fontSize="sm">
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

const formatActivityType = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
