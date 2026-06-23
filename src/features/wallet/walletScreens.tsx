import { Link } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Heading,
  Icon,
  Menu,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Coins,
  Ellipsis,
  ExternalLink,
  ShieldCheck,
  Vote,
} from 'lucide-react'
import { useMemo } from 'react'
import useWalletQuery from './useWalletQuery'
import type { AppIcon } from '@/components/icons/icon-types'
import type { WalletColorPalette } from '@/features/wallet/walletAssets'
import type {
  HiveVestingDelegation,
  HiveWalletActivity,
  HiveWalletOverview,
} from '@/lib/hive/wallet'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import { Alert } from '@/components/ui/alert'
import { Avatar } from '@/components/ui/avatar'
import { toaster } from '@/components/ui/toaster'
import useProfileQuery from '@/features/profile/useProfileQuery'
import {
  WalletAssetBadge,
  WalletAssetIcon,
} from '@/features/wallet/walletAssets'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { MAX_WITNESS_VOTES, vestsToHivePower } from '@/lib/hive/wallet'

type WalletAssetId = 'hbd' | 'hive' | 'hp'

type WalletAssetAction = {
  label: string
}

type WalletAssetSummary = {
  actions: Array<WalletAssetAction>
  balance: string
  detail: string
  id: WalletAssetId
  note?: string
  palette: WalletColorPalette
  price: string
  route:
    | '/$accountname/wallet/hbd'
    | '/$accountname/wallet/hive'
    | '/$accountname/wallet/hp'
  symbol: 'HBD' | 'HIVE' | 'HP'
  title: string
  value: string
}

type WalletAssetDetail = WalletAssetSummary & {
  description: string
  metrics: Array<{
    detail?: string
    label: string
    value: string
  }>
}

type WalletRouteState = {
  displayName?: string
  fetchedAt?: number
  isOwnWallet: boolean
  isRefreshing: boolean
  onRefresh: () => void
  profileImage?: string
  username: string
  wallet: HiveWalletOverview | null
  walletError?: string
  walletStatus: 'error' | 'loading' | 'ready'
}

export function WalletHomeRouteScreen({
  accountname,
}: {
  accountname: string
}) {
  const state = useWalletRouteState(accountname)

  if (state.walletStatus === 'loading') {
    return <WalletSkeleton username={state.username} />
  }

  if (state.walletStatus === 'error') {
    return (
      <WalletPageFrame
        username={state.username}
        displayName={state.displayName}
        profileImage={state.profileImage}
      >
        <Alert status="error" title="Wallet unavailable">
          {state.walletError ?? 'Unable to load this wallet right now.'}
        </Alert>
      </WalletPageFrame>
    )
  }

  if (!state.wallet) {
    return null
  }

  return (
    <WalletPageFrame
      username={state.username}
      displayName={state.displayName}
      profileImage={state.profileImage}
      fetchedAt={state.fetchedAt}
      isRefreshing={state.isRefreshing}
      onRefresh={state.onRefresh}
    >
      <BalanceOverviewCard wallet={state.wallet} />

      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 340px' }}
        gap={5}
      >
        <Stack gap={5} minW={0}>
          <PrimaryAssetsSection
            wallet={state.wallet}
            username={state.username}
            isOwnWallet={state.isOwnWallet}
          />
          {state.wallet.outgoingDelegations.length > 0 ? (
            <DelegationsPanel wallet={state.wallet} />
          ) : null}
          {state.wallet.hiveEngineBalances.length > 0 ? (
            <EngineSummaryPanel wallet={state.wallet} />
          ) : null}
        </Stack>

        <Stack gap={5} minW={0}>
          <AccountHealthPanel wallet={state.wallet} />
          <RecentActivityPanel activity={state.wallet.activity.slice(0, 8)} />
        </Stack>
      </Grid>
    </WalletPageFrame>
  )
}

export function WalletAssetRouteScreen({
  accountname,
  assetId,
}: {
  accountname: string
  assetId: WalletAssetId
}) {
  const state = useWalletRouteState(accountname)

  if (state.walletStatus === 'loading') {
    return <WalletSkeleton username={state.username} />
  }

  if (state.walletStatus === 'error') {
    return (
      <WalletPageFrame
        username={state.username}
        displayName={state.displayName}
        profileImage={state.profileImage}
      >
        <Alert status="error" title="Wallet unavailable">
          {state.walletError ?? 'Unable to load this wallet right now.'}
        </Alert>
      </WalletPageFrame>
    )
  }

  if (!state.wallet) {
    return null
  }

  const asset = buildWalletAssetDetail(state.wallet, assetId)
  const activity = filterActivityForAsset(assetId, state.wallet.activity).slice(
    0,
    10,
  )

  return (
    <WalletPageFrame
      username={state.username}
      displayName={state.displayName}
      profileImage={state.profileImage}
      fetchedAt={state.fetchedAt}
      isRefreshing={state.isRefreshing}
      onRefresh={state.onRefresh}
    >
      <HStack wrap="wrap" justify="space-between" gap={3}>
        <Button asChild variant="ghost" size="sm">
          <Link
            to="/$accountname/wallet"
            params={{ accountname: `@${state.username}` }}
          >
            <Icon as={ArrowLeft} />
            Back to wallet
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a
            href={`https://hiveblocks.com/@${state.username}`}
            target="_blank"
            rel="noreferrer"
          >
            <Icon as={ExternalLink} />
            Open on Hiveblocks
          </a>
        </Button>
      </HStack>

      <AssetDetailHero
        asset={asset}
        username={state.username}
        isOwnWallet={state.isOwnWallet}
      />

      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 340px' }}
        gap={5}
      >
        <Stack gap={5} minW={0}>
          <AssetBreakdownPanel asset={asset} />
          <RecentActivityPanel
            activity={activity}
            title={`${asset.title} activity`}
            description={`Recent public operations most relevant to ${asset.title}.`}
            emptyLabel={`No recent ${asset.title.toLowerCase()} activity found.`}
          />
        </Stack>

        <Stack gap={5} minW={0}>
          <AssetActionPanel
            asset={asset}
            username={state.username}
            isOwnWallet={state.isOwnWallet}
          />
          <AssetContextPanel
            asset={asset}
            wallet={state.wallet}
            username={state.username}
          />
        </Stack>
      </Grid>
    </WalletPageFrame>
  )
}

function useWalletRouteState(accountname: string): WalletRouteState {
  const username = accountname.replace(/^@/, '').toLowerCase()
  const profileQuery = useProfileQuery(username)
  const walletQuery = useWalletQuery(username)
  const { activeAccount } = useHiveWallet()

  if (!walletQuery.data && walletQuery.isLoading) {
    return {
      displayName: profileQuery.data?.displayName,
      fetchedAt: undefined,
      isOwnWallet: activeAccount?.replace(/^@/, '').toLowerCase() === username,
      isRefreshing: false,
      onRefresh: () => {
        void walletQuery.refetch()
      },
      profileImage: profileQuery.data?.profileImage,
      username,
      wallet: null,
      walletStatus: 'loading',
    }
  }

  if (walletQuery.isError) {
    return {
      displayName: profileQuery.data?.displayName,
      fetchedAt: undefined,
      isOwnWallet: activeAccount?.replace(/^@/, '').toLowerCase() === username,
      isRefreshing: false,
      onRefresh: () => {
        void walletQuery.refetch()
      },
      profileImage: profileQuery.data?.profileImage,
      username,
      wallet: null,
      walletError:
        walletQuery.error instanceof Error
          ? walletQuery.error.message
          : 'Unable to load this wallet right now.',
      walletStatus: 'error',
    }
  }

  return {
    displayName: profileQuery.data?.displayName,
    fetchedAt: walletQuery.data?.fetchedAt,
    isOwnWallet: activeAccount?.replace(/^@/, '').toLowerCase() === username,
    isRefreshing: walletQuery.isFetching,
    onRefresh: () => {
      void walletQuery.refetch()
    },
    profileImage: profileQuery.data?.profileImage,
    username,
    wallet: walletQuery.data ?? null,
    walletStatus: 'ready',
  }
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

function BalanceOverviewCard({ wallet }: { wallet: HiveWalletOverview }) {
  const segments = buildBalanceSegments(wallet)

  return (
    <SectionPanel
      colorPalette="red"
      title="Balance"
      accentSymbol="HIVE"
      description="A cleaner read on where this wallet's public value sits right now."
    >
      <Stack gap={4}>
        <HStack justify="space-between" align="start" gap={4} wrap="wrap">
          <Stack gap={1}>
            <Text color="fg.muted" fontSize="sm">
              Visible value
            </Text>
            <Heading
              size="2xl"
              lineHeight="0.95"
              letterSpacing="-0.03em"
              color="colorPalette.fg"
            >
              {formatHbdEstimate(wallet.metrics.estimatedHbdValue)}
            </Heading>
          </Stack>
          <Stack gap={1} align={{ base: 'start', md: 'end' }}>
            <Text color="fg.muted" fontSize="sm">
              Wallet mix
            </Text>
            <Text color="colorPalette.fg" fontWeight="700">
              {segments[0]?.label ?? 'No balances'}
            </Text>
          </Stack>
        </HStack>

        <HStack gap={1} align="stretch" borderRadius="full" overflow="hidden">
          {segments.map((segment) => (
            <Box
              key={segment.label}
              bg={`${segment.colorPalette}.solid`}
              flex={segment.value}
              minH="10px"
              opacity={segment.value > 0 ? 1 : 0.2}
            />
          ))}
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={3}>
          {segments.map((segment) => (
            <HStack key={segment.label} align="start" gap={3}>
              <Box
                bg={`${segment.colorPalette}.solid`}
                borderRadius="full"
                boxSize="10px"
                mt="6px"
                flexShrink={0}
              />
              <Stack gap={0.5}>
                <HStack gap={2} wrap="wrap">
                  <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
                    {segment.label}
                  </Text>
                  <Text color="fg.muted" fontSize="xs">
                    {formatNumber(segment.share, 1)}%
                  </Text>
                </HStack>
                <Text color="colorPalette.fg" fontSize="sm" fontWeight="700">
                  {formatHbdEstimate(segment.value)}
                </Text>
                <Text color="fg.subtle" fontSize="xs">
                  {segment.detail}
                </Text>
              </Stack>
            </HStack>
          ))}
        </SimpleGrid>
      </Stack>
    </SectionPanel>
  )
}

function PrimaryAssetsSection({
  wallet,
  username,
  isOwnWallet,
}: {
  wallet: HiveWalletOverview
  username: string
  isOwnWallet: boolean
}) {
  const assets = useMemo(() => buildPrimaryAssets(wallet), [wallet])

  return (
    <SectionPanel
      colorPalette="orange"
      title="Assets"
      accentSymbol="HIVE"
      description="Tap into the main wallet buckets instead of scanning a dense balance table."
    >
      <Stack gap={3}>
        {assets.map((asset) => (
          <PrimaryAssetCard
            key={asset.id}
            asset={asset}
            username={username}
            isOwnWallet={isOwnWallet}
          />
        ))}
      </Stack>
    </SectionPanel>
  )
}

function PrimaryAssetCard({
  asset,
  username,
  isOwnWallet,
}: {
  asset: WalletAssetSummary
  username: string
  isOwnWallet: boolean
}) {
  return (
    <Box
      bg="bg.subtle"
      border="1px solid"
      borderColor="border"
      borderRadius="18px"
      overflow="hidden"
    >
      <Grid
        templateColumns={{
          base: '1fr auto',
          lg: 'minmax(0, 1.3fr) 0.8fr 0.7fr auto',
        }}
        gap={3}
        px={{ base: 4, md: 5 }}
        py={{ base: 4, md: 4.5 }}
        alignItems="center"
      >
        <Box gridColumn={{ base: '1 / -1', lg: 'auto' }}>
          <Link
            to={asset.route}
            params={{ accountname: `@${username}` }}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <HStack justify="space-between" gap={3} align="start">
              <WalletAssetBadge
                symbol={asset.symbol}
                label={asset.title}
                detail={asset.detail}
              />
              <Icon as={ChevronRight} color="fg.muted" boxSize={4} />
            </HStack>
          </Link>
        </Box>

        <Stack
          gap={0.5}
          display={{ base: 'none', lg: 'flex' }}
          align={{ lg: 'start' }}
        >
          <Text color="fg.muted" fontSize="xs" textTransform="uppercase">
            Price
          </Text>
          <Text color="fg" fontSize="sm" fontWeight="600">
            {asset.price}
          </Text>
          {asset.note ? (
            <Text color="fg.subtle" fontSize="xs">
              {asset.note}
            </Text>
          ) : null}
        </Stack>

        <Stack gap={0.5} align={{ base: 'start', lg: 'end' }}>
          <Text color="fg.muted" fontSize="xs" textTransform="uppercase">
            Balance
          </Text>
          <Text color="fg" fontSize="lg" fontWeight="800" lineHeight="1.1">
            {asset.balance}
          </Text>
          <Text color="fg.subtle" fontSize="xs">
            {asset.value}
          </Text>
        </Stack>

        <AssetActionMenu
          asset={asset}
          username={username}
          isOwnWallet={isOwnWallet}
        />
      </Grid>
    </Box>
  )
}

function AssetActionMenu({
  asset,
  username,
  isOwnWallet,
}: {
  asset: WalletAssetSummary
  username: string
  isOwnWallet: boolean
}) {
  return (
    <Menu.Root positioning={{ placement: 'bottom-end', gutter: 8 }}>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm" aria-label={`${asset.title} actions`}>
          <Icon as={Ellipsis} />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content minW="200px" bg="bg.panel" borderColor="border">
          <Menu.Item value="open" asChild color="fg">
            <Link
              to={asset.route}
              params={{ accountname: `@${username}` }}
              style={{ textDecoration: 'none' }}
            >
              Open {asset.title}
            </Link>
          </Menu.Item>
          {asset.actions.map((action) => (
            <Menu.Item
              key={action.label}
              value={action.label}
              disabled={!isOwnWallet}
              onClick={() => {
                toaster.info({
                  title: `${action.label} is the next wallet action flow`,
                  description:
                    'The route structure is in place. Transaction forms can be wired next.',
                })
              }}
            >
              {action.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}

function AccountHealthPanel({ wallet }: { wallet: HiveWalletOverview }) {
  const witnessCount = wallet.account.witness_votes?.length ?? 0
  const metrics = [
    {
      icon: Vote,
      label: 'Voting mana',
      value: formatNullablePercent(wallet.metrics.votingManaPercent),
      detail: 'Current voting strength',
      palette: 'blue' as const,
    },
    {
      icon: Activity,
      label: 'Resource credits',
      value: formatNullablePercent(wallet.metrics.rcPercent),
      detail: formatCompactRc(wallet.rcAccount?.max_rc),
      palette: 'cyan' as const,
    },
    {
      icon: ShieldCheck,
      label: 'Witness votes',
      value: `${witnessCount} / ${MAX_WITNESS_VOTES}`,
      detail: wallet.account.proxy
        ? `Proxy: @${wallet.account.proxy}`
        : `${MAX_WITNESS_VOTES - witnessCount} remaining`,
      palette: 'purple' as const,
    },
    {
      icon: Coins,
      label: 'HBD savings APR',
      value: formatPercent(wallet.metrics.hbdInterestRate),
      detail: `${formatTokenAmount(wallet.metrics.savingsHbd, 'HBD')} earning`,
      palette: 'green' as const,
    },
  ]

  return (
    <SectionPanel
      colorPalette="blue"
      title="Wallet health"
      accentSymbol="RC"
      description="Only the status signals that help when deciding what to do next."
    >
      <Stack gap={3}>
        {metrics.map((metric) => (
          <SignalRow
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            palette={metric.palette}
          />
        ))}
      </Stack>
    </SectionPanel>
  )
}

function SignalRow({
  icon,
  label,
  value,
  detail,
  palette,
}: {
  icon: AppIcon
  label: string
  value: string
  detail: string
  palette: WalletColorPalette
}) {
  return (
    <HStack
      bg="colorPalette.subtle"
      border="1px solid"
      borderColor="colorPalette.muted"
      borderRadius="14px"
      colorPalette={palette}
      justify="space-between"
      px={3.5}
      py={3}
      gap={3}
    >
      <HStack gap={3} minW={0} align="start">
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
        <Stack gap={0.5} minW={0}>
          <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
            {label}
          </Text>
          <Text color="fg.subtle" fontSize="xs">
            {detail}
          </Text>
        </Stack>
      </HStack>
      <Text color="colorPalette.fg" fontSize="sm" fontWeight="700">
        {value}
      </Text>
    </HStack>
  )
}

function RecentActivityPanel({
  activity,
  title = 'Recent activity',
  description = 'A compact readout of the most recent public wallet operations.',
  emptyLabel = 'No recent activity found.',
}: {
  activity: Array<HiveWalletActivity>
  description?: string
  emptyLabel?: string
  title?: string
}) {
  return (
    <SectionPanel
      colorPalette="orange"
      title={title}
      accentSymbol="ENGINE"
      description={description}
    >
      {activity.length > 0 ? (
        <Stack gap={3}>
          {activity.map((entry) => (
            <HStack
              key={entry.id}
              justify="space-between"
              align="start"
              gap={4}
            >
              <Stack gap={0.5} minW={0}>
                <Text color="fg" fontSize="sm" fontWeight="600">
                  {formatActivityType(entry.type)}
                </Text>
                <Text color="fg.muted" fontSize="xs">
                  {entry.description}
                </Text>
                <Text color="fg.subtle" fontSize="xs">
                  {formatDate(entry.timestamp)}
                </Text>
              </Stack>
              <Text
                color="fg"
                fontSize="sm"
                fontWeight="600"
                whiteSpace="nowrap"
              >
                {entry.amount || '—'}
              </Text>
            </HStack>
          ))}
        </Stack>
      ) : (
        <Text color="fg.muted" fontSize="sm">
          {emptyLabel}
        </Text>
      )}
    </SectionPanel>
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
    <SectionPanel
      colorPalette="purple"
      title="Delegations"
      accentSymbol="HP"
      description="Outgoing Hive Power stays visible here, but it no longer crowds the main balance readout."
    >
      <Stack gap={3}>
        <HStack
          bg="colorPalette.subtle"
          border="1px solid"
          borderColor="colorPalette.muted"
          borderRadius="14px"
          justify="space-between"
          px={3.5}
          py={3}
        >
          <Stack gap={0.5}>
            <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
              {wallet.outgoingDelegations.length} active delegates
            </Text>
            <Text color="fg.subtle" fontSize="xs">
              {formatNumber(
                safePercent(totalDelegated, wallet.metrics.hivePower),
                1,
              )}
              % of owned Hive Power is delegated out
            </Text>
          </Stack>
          <Text color="colorPalette.fg" fontSize="sm" fontWeight="700">
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

function EngineSummaryPanel({ wallet }: { wallet: HiveWalletOverview }) {
  return (
    <SectionPanel
      colorPalette="orange"
      title="Other balances"
      accentSymbol="ENGINE"
      description="Hive Engine tokens are grouped here so the main wallet view stays focused on the core Hive assets."
    >
      <Stack gap={3}>
        <HStack justify="space-between">
          <Text color="fg" fontSize="sm" fontWeight="600">
            Distinct engine balances
          </Text>
          <Text color="fg" fontSize="sm" fontWeight="700">
            {wallet.hiveEngineBalances.length}
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={2}>
          {wallet.hiveEngineBalances.slice(0, 6).map((balance) => (
            <Box
              key={balance.symbol}
              bg="colorPalette.subtle"
              border="1px solid"
              borderColor="colorPalette.muted"
              borderRadius="14px"
              px={3}
              py={2.5}
            >
              <WalletAssetBadge symbol={balance.symbol} />
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </SectionPanel>
  )
}

function AssetDetailHero({
  asset,
  username,
  isOwnWallet,
}: {
  asset: WalletAssetDetail
  username: string
  isOwnWallet: boolean
}) {
  return (
    <SectionPanel
      colorPalette={asset.palette}
      title={asset.title}
      accentSymbol={asset.symbol}
      description={asset.description}
    >
      <Stack gap={5}>
        <HStack justify="space-between" align="start" gap={4} wrap="wrap">
          <Stack gap={1.5}>
            <WalletAssetBadge symbol={asset.symbol} label={asset.title} />
            <Heading
              color="colorPalette.fg"
              size="2xl"
              lineHeight="0.95"
              letterSpacing="-0.03em"
            >
              {asset.balance}
            </Heading>
            <Text color="colorPalette.muted" maxW="56ch">
              {asset.detail}
            </Text>
          </Stack>
          <Stack gap={2} align={{ base: 'start', md: 'end' }}>
            <Badge colorPalette={asset.palette} variant="subtle">
              {asset.price}
            </Badge>
            <Badge colorPalette={asset.palette} variant="subtle">
              {asset.value}
            </Badge>
            {!isOwnWallet ? (
              <Badge colorPalette="gray" variant="subtle">
                Viewing @{username}'s public wallet
              </Badge>
            ) : null}
          </Stack>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          {asset.metrics.slice(0, 3).map((metric) => (
            <Box
              key={metric.label}
              bg="colorPalette.subtle"
              border="1px solid"
              borderColor="colorPalette.muted"
              borderRadius="16px"
              px={4}
              py={3.5}
            >
              <Stack gap={1}>
                <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
                  {metric.label}
                </Text>
                <Text color="colorPalette.fg" fontSize="xl" fontWeight="800">
                  {metric.value}
                </Text>
                {metric.detail ? (
                  <Text color="colorPalette.muted" fontSize="xs">
                    {metric.detail}
                  </Text>
                ) : null}
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </SectionPanel>
  )
}

function AssetBreakdownPanel({ asset }: { asset: WalletAssetDetail }) {
  return (
    <SectionPanel
      colorPalette={asset.palette}
      title="Breakdown"
      accentSymbol={asset.symbol}
      description="The supporting figures behind the main balance."
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
        {asset.metrics.map((metric) => (
          <Box
            key={metric.label}
            bg="colorPalette.subtle"
            border="1px solid"
            borderColor="colorPalette.muted"
            borderRadius="14px"
            px={3.5}
            py={3}
          >
            <Stack gap={1}>
              <Text color="colorPalette.fg" fontSize="sm" fontWeight="600">
                {metric.label}
              </Text>
              <Text color="colorPalette.fg" fontSize="lg" fontWeight="800">
                {metric.value}
              </Text>
              {metric.detail ? (
                <Text color="colorPalette.muted" fontSize="xs">
                  {metric.detail}
                </Text>
              ) : null}
            </Stack>
          </Box>
        ))}
      </SimpleGrid>
    </SectionPanel>
  )
}

function AssetActionPanel({
  asset,
  username,
  isOwnWallet,
}: {
  asset: WalletAssetDetail
  username: string
  isOwnWallet: boolean
}) {
  return (
    <SectionPanel
      colorPalette={asset.palette}
      title="Actions"
      accentSymbol={asset.symbol}
      description={
        isOwnWallet
          ? 'The right action labels are in place here. Transaction flows can plug into these next.'
          : `You are viewing @${username}'s public wallet, so actions stay disabled.`
      }
    >
      <Stack gap={3}>
        {asset.actions.map((action) => (
          <Button
            key={action.label}
            colorPalette={asset.palette}
            variant="subtle"
            disabled={!isOwnWallet}
            onClick={() => {
              toaster.info({
                title: `${action.label} is not wired yet`,
                description:
                  'This second pass focuses on wallet structure, drill-down pages, and action placement.',
              })
            }}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </SectionPanel>
  )
}

function AssetContextPanel({
  asset,
  wallet,
  username,
}: {
  asset: WalletAssetDetail
  wallet: HiveWalletOverview
  username: string
}) {
  return (
    <SectionPanel
      colorPalette="blue"
      title="Context"
      accentSymbol={asset.symbol}
      description="Useful side information without repeating the whole wallet."
    >
      <Stack gap={3}>
        <MetricLine
          label="Wallet value share"
          value={`${formatNumber(
            safePercent(
              parseDollarLike(asset.value),
              wallet.metrics.estimatedHbdValue,
            ),
            1,
          )}%`}
          detail={`${asset.title} contribution to visible value`}
        />
        <MetricLine
          label="Updated"
          value={formatUpdatedAt(wallet.fetchedAt)}
          detail={`Snapshot for @${username}`}
        />
        <MetricLine
          label="Engine balances"
          value={String(wallet.hiveEngineBalances.length)}
          detail="Sidechain balances tracked separately"
        />
      </Stack>
    </SectionPanel>
  )
}

function MetricLine({
  label,
  value,
  detail,
}: {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
}) {
  return (
    <HStack justify="space-between" gap={4} align="start">
      <Stack gap={0} minW={0}>
        <Text fontSize="sm" color="fg.muted">
          {label}
        </Text>
        {detail ? (
          <Text fontSize="xs" color="fg.subtle">
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
        {children}
      </Stack>
    </Box>
  )
}

function WalletSkeleton({ username }: { username: string }) {
  return (
    <WalletPageFrame username={username}>
      <Skeleton h="220px" borderRadius="18px" />
      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 340px' }}
        gap={5}
      >
        <Stack gap={5}>
          <Skeleton h="360px" borderRadius="18px" />
          <Skeleton h="220px" borderRadius="18px" />
        </Stack>
        <Stack gap={5}>
          <Skeleton h="260px" borderRadius="18px" />
          <Skeleton h="320px" borderRadius="18px" />
        </Stack>
      </Grid>
    </WalletPageFrame>
  )
}

function buildBalanceSegments(wallet: HiveWalletOverview) {
  const { metrics } = wallet
  const segments = [
    {
      colorPalette: 'red' as const,
      detail: `${formatTokenAmount(metrics.liquidHive + metrics.savingsHive, 'HIVE')} across liquid and savings`,
      label: 'HIVE',
      value: estimateHiveValue(
        metrics.liquidHive + metrics.savingsHive,
        metrics.hivePriceHbd,
      ),
    },
    {
      colorPalette: 'green' as const,
      detail: `${formatTokenAmount(metrics.liquidHbd + metrics.savingsHbd, 'HBD')} total`,
      label: 'HBD',
      value: metrics.liquidHbd + metrics.savingsHbd,
    },
    {
      colorPalette: 'purple' as const,
      detail: `${formatTokenAmount(metrics.hivePower, 'HP')} owned`,
      label: 'HP',
      value: estimateHiveValue(metrics.hivePower, metrics.hivePriceHbd),
    },
    {
      colorPalette: 'orange' as const,
      detail:
        wallet.hiveEngineBalances.length > 0
          ? `${wallet.hiveEngineBalances.length} unpriced engine balances`
          : 'No sidechain balances detected',
      label: 'Other',
      value: 0,
    },
  ]

  return segments
    .map((segment) => ({
      ...segment,
      share: safePercent(segment.value, metrics.estimatedHbdValue),
    }))
    .sort((left, right) => right.value - left.value)
}

function buildPrimaryAssets(
  wallet: HiveWalletOverview,
): Array<WalletAssetSummary> {
  const { metrics } = wallet

  return [
    {
      actions: [{ label: 'Transfer' }, { label: 'Stake' }],
      balance: formatTokenAmount(metrics.liquidHive, 'HIVE'),
      detail: `${formatTokenAmount(metrics.savingsHive, 'HIVE')} in savings`,
      id: 'hive',
      note: 'Liquid first',
      palette: 'red',
      price: formatHbdEstimate(metrics.hivePriceHbd),
      route: '/$accountname/wallet/hive',
      symbol: 'HIVE',
      title: 'Hive',
      value: formatHbdEstimate(
        estimateHiveValue(
          metrics.liquidHive + metrics.savingsHive,
          metrics.hivePriceHbd,
        ),
      ),
    },
    {
      actions: [{ label: 'Power down' }, { label: 'Delegate' }],
      balance: formatTokenAmount(metrics.hivePower, 'HP'),
      detail: `${formatTokenAmount(metrics.effectiveHivePower, 'HP')} effective`,
      id: 'hp',
      note: `${formatTokenAmount(metrics.delegatedHivePower, 'HP')} delegated out`,
      palette: 'purple',
      price: formatHbdEstimate(metrics.hivePriceHbd),
      route: '/$accountname/wallet/hp',
      symbol: 'HP',
      title: 'Hive Power',
      value: formatHbdEstimate(
        estimateHiveValue(metrics.hivePower, metrics.hivePriceHbd),
      ),
    },
    {
      actions: [{ label: 'Transfer' }, { label: 'Move to savings' }],
      balance: formatTokenAmount(metrics.liquidHbd + metrics.savingsHbd, 'HBD'),
      detail: `${formatTokenAmount(metrics.savingsHbd, 'HBD')} earning ${formatPercent(metrics.hbdInterestRate)}`,
      id: 'hbd',
      note: 'Price anchored to HBD',
      palette: 'green',
      price: '$1.000 HBD',
      route: '/$accountname/wallet/hbd',
      symbol: 'HBD',
      title: 'Hive Dollar',
      value: formatHbdEstimate(metrics.liquidHbd + metrics.savingsHbd),
    },
  ]
}

function buildWalletAssetDetail(
  wallet: HiveWalletOverview,
  assetId: WalletAssetId,
): WalletAssetDetail {
  const assets = buildPrimaryAssets(wallet)
  const summary = assets.find((asset) => asset.id === assetId)

  if (!summary) {
    throw new Error(`Unsupported wallet asset: ${assetId}`)
  }

  const { metrics } = wallet

  switch (assetId) {
    case 'hive':
      return {
        ...summary,
        description:
          'Liquid HIVE, savings HIVE, and HIVE-denominated reward context in one place.',
        metrics: [
          {
            label: 'Liquid HIVE',
            value: formatTokenAmount(metrics.liquidHive, 'HIVE'),
            detail: formatHbdEstimate(
              estimateHiveValue(metrics.liquidHive, metrics.hivePriceHbd),
            ),
          },
          {
            label: 'Savings HIVE',
            value: formatTokenAmount(metrics.savingsHive, 'HIVE'),
            detail: 'Held in Hive savings',
          },
          {
            label: 'Reward HIVE',
            value: formatTokenAmount(metrics.rewardHive, 'HIVE'),
            detail: 'Unclaimed liquid reward balance',
          },
          {
            label: 'Price',
            value: formatHbdEstimate(metrics.hivePriceHbd),
            detail: 'Witness median price feed',
          },
        ],
      }
    case 'hp':
      return {
        ...summary,
        description:
          'Staked Hive, delegation posture, and effective influence live here.',
        metrics: [
          {
            label: 'Owned HP',
            value: formatTokenAmount(metrics.hivePower, 'HP'),
            detail: formatHbdEstimate(
              estimateHiveValue(metrics.hivePower, metrics.hivePriceHbd),
            ),
          },
          {
            label: 'Effective HP',
            value: formatTokenAmount(metrics.effectiveHivePower, 'HP'),
            detail: `${formatTokenAmount(metrics.receivedHivePower, 'HP')} received`,
          },
          {
            label: 'Delegated out',
            value: formatTokenAmount(metrics.delegatedHivePower, 'HP'),
            detail: `${formatNumber(
              safePercent(metrics.delegatedHivePower, metrics.hivePower),
              1,
            )}% of owned HP`,
          },
          {
            label: 'Reward HP',
            value: formatTokenAmount(metrics.rewardHivePower, 'HP'),
            detail: 'Unclaimed vesting rewards',
          },
        ],
      }
    case 'hbd':
      return {
        ...summary,
        description:
          'Liquid HBD, savings HBD, and yield context without the extra wallet noise.',
        metrics: [
          {
            label: 'Liquid HBD',
            value: formatTokenAmount(metrics.liquidHbd, 'HBD'),
            detail: formatHbdEstimate(metrics.liquidHbd),
          },
          {
            label: 'Savings HBD',
            value: formatTokenAmount(metrics.savingsHbd, 'HBD'),
            detail: `APR ${formatPercent(metrics.hbdInterestRate)}`,
          },
          {
            label: 'Reward HBD',
            value: formatTokenAmount(metrics.rewardHbd, 'HBD'),
            detail: 'Unclaimed reward balance',
          },
          {
            label: 'Savings withdrawals',
            value: String(wallet.account.savings_withdraw_requests ?? 0),
            detail: 'Open HBD savings withdrawal requests',
          },
        ],
      }
  }
}

function filterActivityForAsset(
  assetId: WalletAssetId,
  activity: Array<HiveWalletActivity>,
) {
  switch (assetId) {
    case 'hive':
      return activity.filter(
        (entry) =>
          entry.amount?.includes('HIVE') ||
          entry.type === 'transfer' ||
          entry.type === 'transfer_to_savings' ||
          entry.type === 'transfer_from_savings',
      )
    case 'hp':
      return activity.filter((entry) =>
        [
          'delegate_vesting_shares',
          'return_vesting_delegation',
          'claim_reward_balance',
          'curation_reward',
          'transfer_to_vesting',
          'withdraw_vesting',
        ].includes(entry.type),
      )
    case 'hbd':
      return activity.filter(
        (entry) =>
          entry.amount?.includes('HBD') ||
          entry.type === 'interest' ||
          entry.type === 'transfer_to_savings' ||
          entry.type === 'transfer_from_savings' ||
          entry.type === 'transfer',
      )
  }
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

const estimateHiveValue = (value: number, hivePriceHbd: number) =>
  value * hivePriceHbd

const safePercent = (value: number, total: number) =>
  total > 0 ? (value / total) * 100 : 0

const parseDollarLike = (value: string) => {
  const parsed = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const formatActivityType = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
