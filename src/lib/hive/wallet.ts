import { hiveClient } from './client'
import { parseAssetAmount } from './payouts'

const HIVE_ENGINE_RPC_URL = 'https://api.hive-engine.com/rpc/contracts'
const MANA_REGEN_SECONDS = 5 * 24 * 60 * 60
const VESTS_TO_MVESTS = 1_000_000
const MAX_WITNESS_VOTES = 30
const WALLET_HISTORY_LIMIT = 30
const WALLET_OPERATION_TYPES = new Set([
  'account_witness_vote',
  'author_reward',
  'claim_reward_balance',
  'curation_reward',
  'delegate_vesting_shares',
  'fill_vesting_withdraw',
  'interest',
  'return_vesting_delegation',
  'transfer',
  'transfer_from_savings',
  'transfer_to_savings',
  'transfer_to_vesting',
  'update_proposal_votes',
  'withdraw_vesting',
])

type HiveManabar = {
  current_mana?: number | string
  last_update_time?: number | string
}

export type HiveWalletAccount = {
  name: string
  balance: string
  hbd_balance: string
  savings_balance: string
  savings_hbd_balance: string
  vesting_shares: string
  delegated_vesting_shares: string
  received_vesting_shares: string
  reward_hive_balance: string
  reward_hbd_balance: string
  reward_vesting_balance: string
  reward_vesting_hive: string
  vesting_withdraw_rate: string
  next_vesting_withdrawal: string
  to_withdraw: number | string
  withdrawn: number | string
  created?: string
  proxy?: string
  proxied_vsf_votes?: Array<number>
  savings_withdraw_requests?: number
  voting_manabar?: HiveManabar
  downvote_manabar?: HiveManabar
  witness_votes?: Array<string>
}

export type HiveDynamicGlobalProperties = {
  hbd_interest_rate?: number
  time?: string
  total_vesting_fund_hive: string
  total_vesting_shares: string
}

type HiveMedianPrice = {
  base: string
  quote: string
}

export type HiveVestingDelegation = {
  delegator: string
  delegatee: string
  vesting_shares: string
  min_delegation_time: string
}

type HiveOperation = [string, Record<string, unknown>]

type HiveHistoryEntry = [
  number,
  {
    block: number
    op: HiveOperation
    timestamp: string
    trx_id: string
    virtual_op: boolean
  },
]

export type HiveWalletActivity = {
  id: string
  index: number
  block: number
  type: string
  timestamp: string
  description: string
  amount?: string
  trxId: string
  virtual: boolean
}

export type HiveEngineBalance = {
  account: string
  symbol: string
  balance: string
  stake: string
  pendingUnstake: string
  delegationsIn: string
  delegationsOut: string
  pendingUndelegations: string
}

export type HiveRcAccount = {
  account: string
  max_rc?: number | string
  delegated_rc?: number | string
  received_delegated_rc?: number | string
  rc_manabar?: HiveManabar
}

export type HiveWalletMetrics = {
  liquidHive: number
  liquidHbd: number
  savingsHive: number
  savingsHbd: number
  hivePower: number
  delegatedHivePower: number
  receivedHivePower: number
  effectiveHivePower: number
  rewardHive: number
  rewardHbd: number
  rewardHivePower: number
  totalOwnedHive: number
  estimatedHbdValue: number
  hivePriceHbd: number
  hbdInterestRate: number
  votingManaPercent: number | null
  downvoteManaPercent: number | null
  rcPercent: number | null
}

export type HiveWalletOverview = {
  username: string
  account: HiveWalletAccount
  dynamicGlobalProperties: HiveDynamicGlobalProperties
  metrics: HiveWalletMetrics
  outgoingDelegations: Array<HiveVestingDelegation>
  hiveEngineBalances: Array<HiveEngineBalance>
  rcAccount: HiveRcAccount | null
  activity: Array<HiveWalletActivity>
  fetchedAt: number
}

const normalizeAccountName = (value: string) =>
  value.trim().replace(/^@/, '').toLowerCase()

const toNumber = (value: number | string | undefined | null) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const parseAsset = (value: string | undefined | null) =>
  parseAssetAmount(value ?? '')?.amount ?? 0

export const vestsToHivePower = (
  vestingShares: string | number | undefined | null,
  properties: Pick<
    HiveDynamicGlobalProperties,
    'total_vesting_fund_hive' | 'total_vesting_shares'
  >,
) => {
  const vests =
    typeof vestingShares === 'number'
      ? vestingShares
      : parseAsset(vestingShares)
  const totalHive = parseAsset(properties.total_vesting_fund_hive)
  const totalVests = parseAsset(properties.total_vesting_shares)
  if (!vests || !totalHive || !totalVests) return 0
  return (vests * totalHive) / totalVests
}

const resolveHivePriceInHbd = (price: HiveMedianPrice | null) => {
  const base = parseAssetAmount(price?.base ?? '')
  const quote = parseAssetAmount(price?.quote ?? '')
  if (!base || !quote || base.amount <= 0 || quote.amount <= 0) return 0
  if (base.symbol === 'HBD' && quote.symbol === 'HIVE') {
    return base.amount / quote.amount
  }
  if (base.symbol === 'HIVE' && quote.symbol === 'HBD') {
    return quote.amount / base.amount
  }
  return 0
}

const calculateRegeneratedManaPercent = (
  manabar: HiveManabar | undefined,
  maxMana: number,
) => {
  if (!manabar || maxMana <= 0) return null
  const current = toNumber(manabar.current_mana)
  const updatedAt = toNumber(manabar.last_update_time)
  const elapsedSeconds = Math.max(0, Date.now() / 1000 - updatedAt)
  const regenerated = current + (maxMana * elapsedSeconds) / MANA_REGEN_SECONDS
  return Math.min(
    100,
    Math.max(0, (Math.min(maxMana, regenerated) / maxMana) * 100),
  )
}

const findStringValue = (
  payload: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = payload[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const findAmount = (
  payload: Record<string, unknown>,
  keys: Array<string>,
): string | undefined => {
  for (const key of keys) {
    const value = findStringValue(payload, key)
    if (value && parseAssetAmount(value)) return value
  }
  return undefined
}

const joinRewardAmounts = (payload: Record<string, unknown>) =>
  ['reward_hive', 'reward_hbd', 'reward_vests']
    .map((key) => findStringValue(payload, key))
    .filter((value): value is string => Boolean(value && parseAsset(value) > 0))
    .join(' + ')

const formatOperationType = (type: string) =>
  type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const describeOperation = (type: string, payload: Record<string, unknown>) => {
  const from = findStringValue(payload, 'from')
  const to = findStringValue(payload, 'to')
  const account = findStringValue(payload, 'account')
  const author = findStringValue(payload, 'author')
  const voter = findStringValue(payload, 'voter')
  const delegatee = findStringValue(payload, 'delegatee')
  const delegator = findStringValue(payload, 'delegator')

  switch (type) {
    case 'transfer':
      return from && to ? `@${from} to @${to}` : 'Transfer'
    case 'transfer_to_vesting':
      return to ? `Power up for @${to}` : 'Power up'
    case 'transfer_to_savings':
      return to ? `Moved to savings for @${to}` : 'Moved to savings'
    case 'transfer_from_savings':
      return to ? `Savings withdrawal to @${to}` : 'Savings withdrawal'
    case 'claim_reward_balance':
      return account ? `Claimed rewards for @${account}` : 'Claimed rewards'
    case 'curation_reward':
      return author ? `Curation reward from @${author}` : 'Curation reward'
    case 'author_reward':
      return author ? `Author reward for @${author}` : 'Author reward'
    case 'delegate_vesting_shares':
      return delegatee
        ? `Delegated Hive Power to @${delegatee}`
        : 'Delegated Hive Power'
    case 'return_vesting_delegation':
      return account
        ? `Returned Hive Power to @${account}`
        : 'Returned Hive Power'
    case 'fill_vesting_withdraw':
      return from && to ? `Power down from @${from} to @${to}` : 'Power down'
    case 'interest':
      return account ? `Savings interest for @${account}` : 'Savings interest'
    case 'vote':
      return voter && author ? `@${voter} voted on @${author}` : 'Vote'
    case 'update_proposal_votes':
      return 'DHF proposal vote update'
    case 'account_witness_vote':
      return 'Witness vote update'
    case 'custom_json':
      return findStringValue(payload, 'id') === 'rc'
        ? 'Resource credit delegation'
        : 'Custom JSON'
    default:
      if (delegator && delegatee) return `@${delegator} to @${delegatee}`
      return formatOperationType(type)
  }
}

const mapHistoryEntry = ([
  index,
  entry,
]: HiveHistoryEntry): HiveWalletActivity => {
  const [type, payload] = entry.op
  const rewardAmount =
    type === 'claim_reward_balance' ? joinRewardAmounts(payload) : ''
  const amount =
    rewardAmount ||
    findAmount(payload, [
      'amount',
      'reward',
      'vesting_shares',
      'reward_hive',
      'reward_hbd',
      'reward_vests',
    ])

  return {
    id: `${entry.block}-${index}`,
    index,
    block: entry.block,
    type,
    timestamp: entry.timestamp,
    description: describeOperation(type, payload),
    amount,
    trxId: entry.trx_id,
    virtual: entry.virtual_op,
  }
}

const isWalletHistoryEntry = ([, entry]: HiveHistoryEntry) => {
  const [type, payload] = entry.op
  return (
    WALLET_OPERATION_TYPES.has(type) ||
    (type === 'custom_json' && findStringValue(payload, 'id') === 'rc')
  )
}

const fetchHiveEngineBalances = async (account: string) => {
  const response = await fetch(HIVE_ENGINE_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'find',
      params: {
        contract: 'tokens',
        table: 'balances',
        query: { account },
        limit: 100,
        offset: 0,
        indexes: [],
      },
      id: 1,
    }),
  })

  if (!response.ok) {
    throw new Error('Unable to load Hive Engine balances')
  }

  const payload = (await response.json()) as {
    result?: Array<HiveEngineBalance>
    error?: { message?: string }
  }

  if (payload.error) {
    throw new Error(
      payload.error.message ?? 'Unable to load Hive Engine balances',
    )
  }

  return payload.result ?? []
}

const fetchOptional = async <T>(request: Promise<T>, fallback: T) => {
  try {
    return await request
  } catch {
    return fallback
  }
}

export const fetchWalletOverview = async (
  username: string,
): Promise<HiveWalletOverview> => {
  const normalized = normalizeAccountName(username)
  if (!normalized) {
    throw new Error('A Hive account name is required')
  }

  const accountsPromise = hiveClient.database.getAccounts([normalized])
  const propertiesPromise = hiveClient.call(
    'condenser_api',
    'get_dynamic_global_properties',
    [],
  ) as Promise<HiveDynamicGlobalProperties>
  const pricePromise = fetchOptional(
    hiveClient.call(
      'condenser_api',
      'get_current_median_history_price',
      [],
    ) as Promise<HiveMedianPrice>,
    null,
  )
  const delegationsPromise = fetchOptional(
    hiveClient.call('condenser_api', 'get_vesting_delegations', [
      normalized,
      '',
      100,
    ]) as Promise<Array<HiveVestingDelegation>>,
    [],
  )
  const historyPromise = fetchOptional(
    hiveClient.call('condenser_api', 'get_account_history', [
      normalized,
      -1,
      100,
    ]) as Promise<Array<HiveHistoryEntry>>,
    [],
  )
  const rcPromise = fetchOptional(
    hiveClient.call('rc_api', 'find_rc_accounts', {
      accounts: [normalized],
    }) as Promise<{ rc_accounts?: Array<HiveRcAccount> }>,
    { rc_accounts: [] },
  )
  const hiveEnginePromise = fetchOptional(
    fetchHiveEngineBalances(normalized),
    [],
  )

  const [
    accounts,
    properties,
    medianPrice,
    outgoingDelegations,
    history,
    rcResult,
    hiveEngineBalances,
  ] = await Promise.all([
    accountsPromise,
    propertiesPromise,
    pricePromise,
    delegationsPromise,
    historyPromise,
    rcPromise,
    hiveEnginePromise,
  ])

  const account = accounts[0] as HiveWalletAccount | undefined
  if (!account) {
    throw new Error(`No Hive account found for @${normalized}`)
  }

  const liquidHive = parseAsset(account.balance)
  const liquidHbd = parseAsset(account.hbd_balance)
  const savingsHive = parseAsset(account.savings_balance)
  const savingsHbd = parseAsset(account.savings_hbd_balance)
  const hivePower = vestsToHivePower(account.vesting_shares, properties)
  const delegatedHivePower = vestsToHivePower(
    account.delegated_vesting_shares,
    properties,
  )
  const receivedHivePower = vestsToHivePower(
    account.received_vesting_shares,
    properties,
  )
  const effectiveHivePower = hivePower - delegatedHivePower + receivedHivePower
  const rewardHive = parseAsset(account.reward_hive_balance)
  const rewardHbd = parseAsset(account.reward_hbd_balance)
  const rewardHivePower = vestsToHivePower(
    account.reward_vesting_balance,
    properties,
  )
  const hivePriceHbd = resolveHivePriceInHbd(medianPrice)
  const totalOwnedHive =
    liquidHive + savingsHive + hivePower + rewardHive + rewardHivePower
  const estimatedHbdValue =
    totalOwnedHive * hivePriceHbd + liquidHbd + savingsHbd + rewardHbd
  const effectiveVests = Math.max(
    0,
    parseAsset(account.vesting_shares) -
      parseAsset(account.delegated_vesting_shares) +
      parseAsset(account.received_vesting_shares),
  )
  const votingManaMax = effectiveVests * VESTS_TO_MVESTS
  const rcAccount = rcResult.rc_accounts?.[0] ?? null
  const rcMax = toNumber(rcAccount?.max_rc)

  return {
    username: normalized,
    account,
    dynamicGlobalProperties: properties,
    metrics: {
      liquidHive,
      liquidHbd,
      savingsHive,
      savingsHbd,
      hivePower,
      delegatedHivePower,
      receivedHivePower,
      effectiveHivePower,
      rewardHive,
      rewardHbd,
      rewardHivePower,
      totalOwnedHive,
      estimatedHbdValue,
      hivePriceHbd,
      hbdInterestRate: toNumber(properties.hbd_interest_rate) / 100,
      votingManaPercent: calculateRegeneratedManaPercent(
        account.voting_manabar,
        votingManaMax,
      ),
      downvoteManaPercent: calculateRegeneratedManaPercent(
        account.downvote_manabar,
        votingManaMax * 0.25,
      ),
      rcPercent: calculateRegeneratedManaPercent(rcAccount?.rc_manabar, rcMax),
    },
    outgoingDelegations,
    hiveEngineBalances: hiveEngineBalances
      .filter((balance) =>
        [
          balance.balance,
          balance.stake,
          balance.delegationsIn,
          balance.delegationsOut,
          balance.pendingUnstake,
          balance.pendingUndelegations,
        ].some((value) => toNumber(value) > 0),
      )
      .sort((left, right) => left.symbol.localeCompare(right.symbol)),
    rcAccount,
    activity: history
      .filter(isWalletHistoryEntry)
      .map(mapHistoryEntry)
      .reverse()
      .slice(0, WALLET_HISTORY_LIMIT),
    fetchedAt: Date.now(),
  }
}

export { MAX_WITNESS_VOTES }
