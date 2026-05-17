import { getAccountPosts } from '@ecency/sdk'
import type { PostSearchResult } from '@/lib/hive/search'
import type {
  DashboardBreakdownItem,
  DashboardBucket,
  DashboardBucketUnit,
  DashboardCommunityRewardBreakdown,
  DashboardDelegation,
  DashboardDailyIncomeDay,
  DashboardDailyPostCount,
  DashboardHistoricalOverview,
  DashboardHistoricalSnapshot,
  DashboardIncomeBreakdownCategory,
  DashboardIncomeBreakdownCategoryId,
  DashboardIncomeBreakdownSubcategory,
  DashboardPayoutDistributionBucket,
  DashboardRange,
  DashboardTopPost,
} from './types'
import type {
  HiveDynamicGlobalProperties,
  HiveVestingDelegation,
} from '@/lib/hive/wallet'
import { mapEntryToSearchResult } from '@/features/posts/postMapping'
import { hiveClient } from '@/lib/hive/client'
import { parseAssetAmount } from '@/lib/hive/payouts'
import { vestsToHivePower } from '@/lib/hive/wallet'

const DASHBOARD_STORAGE_KEY = 'hivepen.dashboard.overview.v3'
export const DASHBOARD_TTL_MS = 15 * 60 * 1000

const POSTS_PAGE_SIZE = 20
const POSTS_MAX_PAGES = 40
const HISTORY_PAGE_SIZE = 100
const HISTORY_MAX_PAGES = 30

type RewardHistoryOperation =
  | {
      type: 'curation_reward'
      timestamp: string
      reward: string
    }
  | {
      type: 'interest'
      timestamp: string
      interest: string
    }
  | {
      type: 'producer_reward'
      timestamp: string
      vesting_shares: string
    }
  | {
      type: 'transfer' | 'transfer_from_savings'
      timestamp: string
      amount: string
      from?: string
      to?: string
    }

const RANGE_BUCKET_CONFIG: Record<
  DashboardRange,
  { bucketCount: number; bucketUnit: DashboardBucketUnit }
> = {
  '1M': { bucketCount: 4, bucketUnit: 'week' },
  '3M': { bucketCount: 12, bucketUnit: 'week' },
  '6M': { bucketCount: 6, bucketUnit: 'month' },
  '1Y': { bucketCount: 12, bucketUnit: 'month' },
}

const normalizeUsername = (value: string) =>
  value.trim().replace(/^@/, '').toLowerCase()

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const startOfUtcDay = (value: Date) =>
  new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  )

const addUtcDays = (value: Date, days: number) =>
  new Date(value.getTime() + days * 24 * 60 * 60 * 1000)

const startOfUtcMonth = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1))

const addUtcMonths = (value: Date, months: number) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1))

const formatWeeklyLabel = (value: Date) =>
  value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

const formatMonthlyShortLabel = (value: Date) =>
  value.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })

const formatMonthlyLongLabel = (value: Date) =>
  value.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const formatWeeklyLongLabel = (startAt: Date, endAt: Date) => {
  const inclusiveEnd = addUtcDays(endAt, -1)
  return `${startAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })} - ${inclusiveEnd.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })}`
}

export const buildBuckets = (
  range: DashboardRange,
  now = new Date(),
): Array<DashboardBucket> => {
  const config = RANGE_BUCKET_CONFIG[range]

  if (config.bucketUnit === 'week') {
    const periodEnd = addUtcDays(startOfUtcDay(now), 1)
    const buckets: Array<DashboardBucket> = []

    for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
      const endAt = addUtcDays(periodEnd, -(index * 7))
      const startAt = addUtcDays(endAt, -7)
      buckets.push({
        key: startAt.toISOString(),
        shortLabel: formatWeeklyLabel(startAt),
        longLabel: formatWeeklyLongLabel(startAt, endAt),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        authorRewards: 0,
        curationRewards: 0,
        savingsInterest: 0,
        totalRewards: 0,
        posts: 0,
        votes: 0,
        comments: 0,
      })
    }

    return buckets
  }

  const periodEnd = addUtcMonths(startOfUtcMonth(now), 1)
  const buckets: Array<DashboardBucket> = []

  for (let index = config.bucketCount - 1; index >= 0; index -= 1) {
    const startAt = addUtcMonths(periodEnd, -(index + 1))
    const endAt = addUtcMonths(startAt, 1)
    buckets.push({
      key: startAt.toISOString(),
      shortLabel: formatMonthlyShortLabel(startAt),
      longLabel: formatMonthlyLongLabel(startAt),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      authorRewards: 0,
      curationRewards: 0,
      savingsInterest: 0,
      totalRewards: 0,
      posts: 0,
      votes: 0,
      comments: 0,
    })
  }

  return buckets
}

export const buildDailyIncomeDays = (
  range: DashboardRange,
  now = new Date(),
): Array<DashboardDailyIncomeDay> => {
  const buckets = buildBuckets(range, now)
  const currentStart = new Date(buckets[0]?.startAt ?? now.toISOString())
  const periodEnd = addUtcDays(startOfUtcDay(now), 1)
  const days: Array<DashboardDailyIncomeDay> = []

  for (
    let day = currentStart;
    day.getTime() < periodEnd.getTime();
    day = addUtcDays(day, 1)
  ) {
    days.push({
      date: day.toISOString(),
      authorRewards: 0,
      curationRewards: 0,
      savingsInterest: 0,
      totalRewards: 0,
    })
  }

  return days
}

export const buildDailyPostCounts = (
  range: DashboardRange,
  now = new Date(),
): Array<DashboardDailyPostCount> => {
  const buckets = buildBuckets(range, now)
  const currentStart = new Date(buckets[0]?.startAt ?? now.toISOString())
  const periodEnd = addUtcDays(startOfUtcDay(now), 1)
  const days: Array<DashboardDailyPostCount> = []

  for (
    let day = currentStart;
    day.getTime() < periodEnd.getTime();
    day = addUtcDays(day, 1)
  ) {
    days.push({
      date: day.toISOString(),
      posts: 0,
      comments: 0,
    })
  }

  return days
}

export const getExtendedStart = (range: DashboardRange, now = new Date()) => {
  const currentBuckets = buildBuckets(range, now)
  const currentStart = new Date(currentBuckets[0]?.startAt ?? now.toISOString())
  const { bucketCount, bucketUnit } = RANGE_BUCKET_CONFIG[range]

  return bucketUnit === 'week'
    ? addUtcDays(currentStart, -(bucketCount * 7))
    : addUtcMonths(currentStart, -bucketCount)
}

const readSnapshots = () => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(DASHBOARD_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<
      Record<string, DashboardHistoricalSnapshot>
    >
  } catch {
    return {}
  }
}

const writeSnapshots = (
  snapshots: Partial<Record<string, DashboardHistoricalSnapshot>>,
) => {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(snapshots))
}

const normalizeDashboardSnapshot = (
  snapshot: DashboardHistoricalSnapshot,
): DashboardHistoricalSnapshot => ({
  ...snapshot,
  dailyPostCounts: Array.isArray(snapshot.dailyPostCounts)
    ? snapshot.dailyPostCounts
    : [],
  outgoingDelegations: Array.isArray(snapshot.outgoingDelegations)
    ? snapshot.outgoingDelegations
    : [],
})

const toSnapshotKey = (username: string, range: DashboardRange) =>
  `${normalizeUsername(username)}:${range}`

export const readDashboardSnapshot = (
  username: string,
  range: DashboardRange,
) => {
  const key = toSnapshotKey(username, range)
  const snapshot = readSnapshots()[key]
  if (!snapshot) return null
  if (snapshot.expiresAt <= Date.now()) return null

  const normalizedSnapshot = normalizeDashboardSnapshot(snapshot)

  if (
    !Array.isArray(snapshot.dailyPostCounts) ||
    !Array.isArray(snapshot.outgoingDelegations)
  ) {
    const snapshots = readSnapshots()
    snapshots[key] = normalizedSnapshot
    writeSnapshots(snapshots)
  }

  return normalizedSnapshot
}

export const writeDashboardSnapshot = (
  username: string,
  data: DashboardHistoricalOverview,
) => {
  const snapshots = readSnapshots()
  snapshots[toSnapshotKey(username, data.range)] = normalizeDashboardSnapshot({
    ...data,
    username: normalizeUsername(username),
    expiresAt: data.cachedAt + DASHBOARD_TTL_MS,
  })
  writeSnapshots(snapshots)
}

const getBucketForDate = (
  buckets: Array<DashboardBucket>,
  value: Date,
): DashboardBucket | null => {
  const timestamp = value.getTime()
  for (const bucket of buckets) {
    const startAt = new Date(bucket.startAt).getTime()
    const endAt = new Date(bucket.endAt).getTime()
    if (timestamp >= startAt && timestamp < endAt) {
      return bucket
    }
  }
  return null
}

const getDailyIncomeDayForDate = (
  days: Array<DashboardDailyIncomeDay>,
  value: Date,
): DashboardDailyIncomeDay | null => {
  const dayKey = startOfUtcDay(value).toISOString()
  return days.find((day) => day.date === dayKey) ?? null
}

const getDailyPostCountForDate = (
  days: Array<DashboardDailyPostCount>,
  value: Date,
): DashboardDailyPostCount | null => {
  const dayKey = startOfUtcDay(value).toISOString()
  return days.find((day) => day.date === dayKey) ?? null
}

const toPercentChange = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? 1 : null
  return (current - previous) / previous
}

const convertAssetToHbdEquivalent = (
  assetText: string | undefined,
  properties: Pick<
    HiveDynamicGlobalProperties,
    'total_vesting_fund_hive' | 'total_vesting_shares'
  >,
  hivePriceHbd: number,
) => {
  const asset = parseAssetAmount(assetText ?? '')
  if (!asset) return 0
  if (asset.symbol === 'HBD') return asset.amount
  if (asset.symbol === 'HIVE') return asset.amount * hivePriceHbd
  if (asset.symbol === 'VESTS') {
    return vestsToHivePower(assetText, properties) * hivePriceHbd
  }
  return 0
}

const getPostTotalReward = (
  post: PostSearchResult,
  properties: Pick<
    HiveDynamicGlobalProperties,
    'total_vesting_fund_hive' | 'total_vesting_shares'
  >,
  hivePriceHbd: number,
) =>
  convertAssetToHbdEquivalent(
    post.payout?.total || post.payout?.pending,
    properties,
    hivePriceHbd,
  )

const getPostAuthorReward = (
  post: PostSearchResult,
  properties: Pick<
    HiveDynamicGlobalProperties,
    'total_vesting_fund_hive' | 'total_vesting_shares'
  >,
  hivePriceHbd: number,
) => convertAssetToHbdEquivalent(post.authorPayout, properties, hivePriceHbd)

const getPayloadString = (
  payload: Record<string, unknown>,
  key: string,
): string | undefined => {
  const value = payload[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const UNATTRIBUTED_COMMUNITY_ID = '__unattributed__'
const UNATTRIBUTED_COMMUNITY_LABEL = 'Unattributed'

const resolveCommunityBreakdownKey = (entry: PostSearchResult) =>
  entry.communityId ||
  entry.communityInfo?.id ||
  entry.tags[0] ||
  UNATTRIBUTED_COMMUNITY_ID

const resolveCommunityBreakdownLabel = (entry: PostSearchResult) =>
  entry.communityTitle ||
  entry.communityInfo?.name ||
  entry.tags[0] ||
  UNATTRIBUTED_COMMUNITY_LABEL

const accumulateCommunityReward = (
  collection: Map<string, DashboardCommunityRewardBreakdown>,
  entry: PostSearchResult,
  reward: number,
  rewardKind: 'postRewards' | 'commentRewards',
) => {
  const key = resolveCommunityBreakdownKey(entry)
  const existing = collection.get(key) ?? {
    id: key,
    label: resolveCommunityBreakdownLabel(entry),
    postRewards: 0,
    commentRewards: 0,
    totalRewards: 0,
  }

  existing[rewardKind] += reward
  existing.totalRewards += reward
  collection.set(key, existing)
}

const fetchDashboardEntries = async (
  username: string,
  range: DashboardRange,
  sort: 'posts' | 'comments',
) => {
  const normalized = normalizeUsername(username)
  const trackedStart = getExtendedStart(range)
  const collected = new Map<string, PostSearchResult>()
  let startAuthor: string | undefined
  let startPermlink: string | undefined

  for (let page = 0; page < POSTS_MAX_PAGES; page += 1) {
    const entries =
      (await getAccountPosts(
        sort,
        normalized,
        startAuthor,
        startPermlink,
        POSTS_PAGE_SIZE,
      )) ?? []

    if (entries.length === 0) break

    for (const entry of entries) {
      const mapped = mapEntryToSearchResult(entry)
      collected.set(`${mapped.author}/${mapped.permlink}`, mapped)
    }

    const lastEntry = entries[entries.length - 1]

    const oldestCreated = new Date(lastEntry.created)
    if (Number.isNaN(oldestCreated.getTime()) || oldestCreated < trackedStart) {
      break
    }

    if (entries.length < POSTS_PAGE_SIZE) break

    startAuthor = lastEntry.author
    startPermlink = lastEntry.permlink
  }

  return Array.from(collected.values())
}

const fetchDashboardPosts = (username: string, range: DashboardRange) =>
  fetchDashboardEntries(username, range, 'posts')

const fetchDashboardComments = (username: string, range: DashboardRange) =>
  fetchDashboardEntries(username, range, 'comments')

const fetchOutgoingDelegations = async (username: string) => {
  const normalized = normalizeUsername(username)
  return (await hiveClient.call('condenser_api', 'get_vesting_delegations', [
    normalized,
    '',
    100,
  ])) as Array<HiveVestingDelegation>
}

const fetchRewardHistory = async (username: string, range: DashboardRange) => {
  const normalized = normalizeUsername(username)
  const trackedStart = getExtendedStart(range)
  const operations: Array<RewardHistoryOperation> = []
  let from = -1

  for (let page = 0; page < HISTORY_MAX_PAGES; page += 1) {
    const history = (await hiveClient.call(
      'condenser_api',
      'get_account_history',
      [normalized, from, HISTORY_PAGE_SIZE],
    )) as Array<
      [
        number,
        {
          timestamp: string
          op: [string, Record<string, unknown>]
        },
      ]
    >

    if (history.length === 0) break

    for (let index = history.length - 1; index >= 0; index -= 1) {
      const [, item] = history[index]
      const [type, payload] = item.op
      const timestamp = new Date(item.timestamp)
      if (Number.isNaN(timestamp.getTime())) continue

      if (timestamp < trackedStart) {
        return operations
      }

      if (type === 'curation_reward' && typeof payload.reward === 'string') {
        operations.push({
          type: 'curation_reward',
          timestamp: item.timestamp,
          reward: payload.reward,
        })
      }

      if (type === 'interest' && typeof payload.interest === 'string') {
        operations.push({
          type: 'interest',
          timestamp: item.timestamp,
          interest: payload.interest,
        })
      }

      if (
        type === 'producer_reward' &&
        typeof payload.vesting_shares === 'string'
      ) {
        operations.push({
          type: 'producer_reward',
          timestamp: item.timestamp,
          vesting_shares: payload.vesting_shares,
        })
      }

      if (
        (type === 'transfer' || type === 'transfer_from_savings') &&
        typeof payload.amount === 'string'
      ) {
        operations.push({
          type,
          timestamp: item.timestamp,
          amount: payload.amount,
          from: getPayloadString(payload, 'from'),
          to: getPayloadString(payload, 'to'),
        })
      }
    }

    const [oldestIndex] = history[0]
    if (oldestIndex <= 0) break
    from = oldestIndex - 1
  }

  return operations
}

const fetchDynamicProperties = async () => {
  const properties = (await hiveClient.call(
    'condenser_api',
    'get_dynamic_global_properties',
    [],
  )) as HiveDynamicGlobalProperties

  const medianPrice = (await hiveClient.call(
    'condenser_api',
    'get_current_median_history_price',
    [],
  )) as { base?: string; quote?: string }

  const base = parseAssetAmount(medianPrice.base ?? '')
  const quote = parseAssetAmount(medianPrice.quote ?? '')
  const hivePriceHbd =
    base?.symbol === 'HBD' && quote?.symbol === 'HIVE' && quote.amount > 0
      ? base.amount / quote.amount
      : 0

  return { properties, hivePriceHbd }
}

export const aggregateDashboardOverview = ({
  username,
  posts,
  comments,
  outgoingDelegations,
  range,
  rewardHistory,
  properties,
  hivePriceHbd,
  now = new Date(),
}: {
  username: string
  posts: Array<PostSearchResult>
  comments: Array<PostSearchResult>
  outgoingDelegations: Array<HiveVestingDelegation>
  range: DashboardRange
  rewardHistory: Array<RewardHistoryOperation>
  properties: Pick<
    HiveDynamicGlobalProperties,
    'total_vesting_fund_hive' | 'total_vesting_shares'
  >
  hivePriceHbd: number
  now?: Date
}): DashboardHistoricalOverview => {
  const buckets = buildBuckets(range, now)
  const dailyIncome = buildDailyIncomeDays(range, now)
  const dailyPostCounts = buildDailyPostCounts(range, now)
  const currentStart = new Date(buckets[0]?.startAt ?? now.toISOString())
  const previousStart = getExtendedStart(range, now)
  const normalized = normalizeUsername(username)
  const delegatees = new Set(
    outgoingDelegations
      .map((delegation) => normalizeUsername(delegation.delegatee))
      .filter((delegatee) => delegatee && delegatee !== normalized),
  )
  const delegationSummary: Array<DashboardDelegation> = outgoingDelegations
    .map((delegation) => ({
      delegatee: normalizeUsername(delegation.delegatee),
      hivePower: vestsToHivePower(delegation.vesting_shares, properties),
    }))
    .filter(
      (delegation) =>
        delegation.delegatee.length > 0 &&
        delegation.delegatee !== normalized &&
        delegation.hivePower > 0,
    )
    .sort((left, right) => right.hivePower - left.hivePower)
  // TODO: Attribute transfers against delegation history for the selected range,
  // not just the current live delegatee set.
  // Spec: src/features/dashboard/INCOME_BREAKDOWN_ROADMAP.md

  let currentPostRewardTotal = 0
  let previousPostRewardTotal = 0
  let previousPublishedPosts = 0
  let previousPostRewards = 0
  let previousCommentRewards = 0
  let previousCurationRewards = 0
  let previousSavingsInterest = 0
  let previousWitnessRewards = 0
  let previousTransfersFromDelegatees = 0
  let previousOtherTransfers = 0

  let currentPostAuthorRewards = 0
  let currentCommentAuthorRewards = 0
  let currentCurationRewards = 0
  let currentSavingsInterest = 0
  let currentWitnessRewards = 0
  let currentTransfersFromDelegatees = 0
  let currentOtherTransfers = 0

  const topPosts: Array<DashboardTopPost> = []
  const payoutDistributionMap = new Map<string, DashboardPayoutDistributionBucket>()
  const communityRewardMap = new Map<string, DashboardCommunityRewardBreakdown>()

  for (const bucket of buckets) {
    payoutDistributionMap.set(bucket.key, {
      key: bucket.key,
      shortLabel: bucket.shortLabel,
      longLabel: bucket.longLabel,
      rewards: [],
    })
  }

  for (const post of posts) {
    const createdAt = new Date(post.created)
    if (Number.isNaN(createdAt.getTime()) || createdAt < previousStart) {
      continue
    }

    const authorReward = getPostAuthorReward(post, properties, hivePriceHbd)
    const totalReward = getPostTotalReward(post, properties, hivePriceHbd)

    if (createdAt >= currentStart) {
      const bucket = getBucketForDate(buckets, createdAt)
      const day = getDailyIncomeDayForDate(dailyIncome, createdAt)
      const dayPostCount = getDailyPostCountForDate(dailyPostCounts, createdAt)
      if (!bucket || !day) continue

      bucket.authorRewards += authorReward
      bucket.totalRewards += authorReward
      day.authorRewards += authorReward
      day.totalRewards += authorReward
      bucket.posts += 1
      if (dayPostCount) {
        dayPostCount.posts += 1
      }
      bucket.votes += post.votes ?? 0
      bucket.comments += post.comments ?? 0

      currentPostAuthorRewards += authorReward
      currentPostRewardTotal += totalReward
      payoutDistributionMap.get(bucket.key)?.rewards.push(totalReward)
      accumulateCommunityReward(
        communityRewardMap,
        post,
        authorReward,
        'postRewards',
      )

      topPosts.push({
        id: `${post.author}/${post.permlink}`,
        author: post.author,
        permlink: post.permlink,
        title: post.title,
        created: post.created,
        coverUrl: post.coverUrl,
        communityId: post.communityId,
        communityTitle: post.communityTitle,
        communityInfo: post.communityInfo,
        totalReward,
        authorReward,
        votes: post.votes ?? 0,
        comments: post.comments ?? 0,
        primaryTag: post.tags[0],
      })
    } else {
      previousPostRewards += authorReward
      previousPostRewardTotal += totalReward
      previousPublishedPosts += 1
    }
  }

  for (const comment of comments) {
    const createdAt = new Date(comment.created)
    if (Number.isNaN(createdAt.getTime()) || createdAt < previousStart) {
      continue
    }

    const authorReward = getPostAuthorReward(comment, properties, hivePriceHbd)

    if (createdAt >= currentStart) {
      const bucket = getBucketForDate(buckets, createdAt)
      const day = getDailyIncomeDayForDate(dailyIncome, createdAt)
      const dayPostCount = getDailyPostCountForDate(dailyPostCounts, createdAt)
      if (!bucket || !day) continue

      bucket.authorRewards += authorReward
      bucket.totalRewards += authorReward
      day.authorRewards += authorReward
      day.totalRewards += authorReward
      if (dayPostCount) {
        dayPostCount.comments += 1
      }
      currentCommentAuthorRewards += authorReward
      accumulateCommunityReward(
        communityRewardMap,
        comment,
        authorReward,
        'commentRewards',
      )
    } else {
      previousCommentRewards += authorReward
    }
  }

  for (const operation of rewardHistory) {
    const timestamp = new Date(operation.timestamp)
    if (Number.isNaN(timestamp.getTime()) || timestamp < previousStart) {
      continue
    }

    const amount =
      operation.type === 'curation_reward'
        ? convertAssetToHbdEquivalent(
            operation.reward,
            properties,
            hivePriceHbd,
          )
        : operation.type === 'interest'
          ? convertAssetToHbdEquivalent(
              operation.interest,
              properties,
              hivePriceHbd,
            )
          : operation.type === 'producer_reward'
            ? convertAssetToHbdEquivalent(
                operation.vesting_shares,
                properties,
                hivePriceHbd,
              )
            : convertAssetToHbdEquivalent(
                operation.amount,
                properties,
                hivePriceHbd,
              )

    if (timestamp >= currentStart) {
      const bucket = getBucketForDate(buckets, timestamp)
      const day = getDailyIncomeDayForDate(dailyIncome, timestamp)
      if (!bucket || !day) continue

      if (operation.type === 'curation_reward') {
        bucket.curationRewards += amount
        currentCurationRewards += amount
        bucket.totalRewards += amount
        day.curationRewards += amount
        day.totalRewards += amount
      } else if (operation.type === 'interest') {
        bucket.savingsInterest += amount
        currentSavingsInterest += amount
        bucket.totalRewards += amount
        day.savingsInterest += amount
        day.totalRewards += amount
      } else if (operation.type === 'producer_reward') {
        currentWitnessRewards += amount
      } else if (operation.to === normalized && operation.from !== normalized) {
        // We treat transfers from current delegatees as attributable relationship
        // signals, but we do not infer that delegation operations themselves are income.
        if (operation.from && delegatees.has(normalizeUsername(operation.from))) {
          currentTransfersFromDelegatees += amount
        } else {
          currentOtherTransfers += amount
        }
      }
    } else if (operation.type === 'curation_reward') {
      previousCurationRewards += amount
    } else if (operation.type === 'interest') {
      previousSavingsInterest += amount
    } else if (operation.type === 'producer_reward') {
      previousWitnessRewards += amount
    } else if (operation.to === normalized && operation.from !== normalized) {
      if (operation.from && delegatees.has(normalizeUsername(operation.from))) {
        previousTransfersFromDelegatees += amount
      } else {
        previousOtherTransfers += amount
      }
    }
  }

  const totalAuthorRewards = currentPostAuthorRewards + currentCommentAuthorRewards
  const totalCurationRewards = buckets.reduce(
    (total, bucket) => total + bucket.curationRewards,
    0,
  )
  const totalSavingsInterest = buckets.reduce(
    (total, bucket) => total + bucket.savingsInterest,
    0,
  )
  const rewardTotal = buckets.reduce((total, bucket) => total + bucket.totalRewards, 0)
  const totalWitnessRewards = currentWitnessRewards
  const totalTransfersFromDelegatees = currentTransfersFromDelegatees
  const totalOtherTransfers = currentOtherTransfers
  const totalTransferIncome = totalTransfersFromDelegatees + totalOtherTransfers
  const incomeBreakdownTotal =
    totalAuthorRewards +
    totalCurationRewards +
    totalSavingsInterest +
    totalWitnessRewards +
    totalTransferIncome
  const incomeBreakdownBase = incomeBreakdownTotal > 0 ? incomeBreakdownTotal : 1

  const createSubcategory = (
    subcategory: Omit<DashboardIncomeBreakdownSubcategory, 'share'>,
  ): DashboardIncomeBreakdownSubcategory => ({
    ...subcategory,
    share: subcategory.value / incomeBreakdownBase,
  })

  const createCategory = ({
    id,
    label,
    colorToken,
    subcategories,
  }: {
    id: DashboardIncomeBreakdownCategoryId
    label: string
    colorToken: string
    subcategories: Array<DashboardIncomeBreakdownSubcategory>
  }): DashboardIncomeBreakdownCategory => {
    const value = subcategories.reduce((total, item) => total + item.value, 0)
    return {
      id,
      label,
      value,
      share: value / incomeBreakdownBase,
      colorToken,
      subcategories,
    }
  }

  const incomeBreakdown = [
    createCategory({
      id: 'author',
      label: 'Author',
      colorToken: 'green.solid',
      subcategories: [
        createSubcategory({
          id: 'post_rewards',
          parentId: 'author',
          label: 'Post rewards',
          value: currentPostAuthorRewards,
          colorToken: 'green.emphasized',
        }),
        createSubcategory({
          id: 'comment_rewards',
          parentId: 'author',
          label: 'Comment rewards',
          value: currentCommentAuthorRewards,
          colorToken: 'green.subtle',
        }),
      ],
    }),
    createCategory({
      id: 'curation',
      label: 'Curation',
      colorToken: 'purple.solid',
      subcategories: [
        createSubcategory({
          id: 'curation_votes',
          parentId: 'curation',
          label: 'Vote curation',
          value: currentCurationRewards,
          colorToken: 'purple.emphasized',
        }),
      ],
    }),
    createCategory({
      id: 'interest',
      label: 'HBD savings',
      colorToken: 'orange.solid',
      subcategories: [
        createSubcategory({
          id: 'hbd_savings',
          parentId: 'interest',
          label: 'HBD interest',
          value: currentSavingsInterest,
          colorToken: 'orange.emphasized',
        }),
      ],
    }),
    createCategory({
      id: 'witness',
      label: 'Witness',
      colorToken: 'cyan.solid',
      subcategories: [
        createSubcategory({
          id: 'witness_blocks',
          parentId: 'witness',
          label: 'Block rewards',
          value: currentWitnessRewards,
          colorToken: 'cyan.emphasized',
        }),
      ],
    }),
    createCategory({
      id: 'transfers',
      label: 'Transfers',
      colorToken: 'red.solid',
      subcategories: [
        createSubcategory({
          id: 'delegation_income',
          parentId: 'transfers',
          label: 'From delegatees',
          value: currentTransfersFromDelegatees,
          colorToken: 'red.emphasized',
        }),
        createSubcategory({
          id: 'other_transfers',
          parentId: 'transfers',
          label: 'Other transfers',
          value: currentOtherTransfers,
          colorToken: 'red.subtle',
        }),
      ],
    }),
  ].filter((category) => category.value > 0)

  const totalRewards = rewardTotal
  const previousTotalRewards =
    previousPostRewards +
    previousCommentRewards +
    previousCurationRewards +
    previousSavingsInterest

  const breakdownBase = totalRewards > 0 ? totalRewards : 1
  const breakdownItems: Array<DashboardBreakdownItem> = [
    {
      id: 'author',
      label: 'Author rewards',
      value: totalAuthorRewards,
      share: totalAuthorRewards / breakdownBase,
      colorToken: 'green.solid',
    },
    {
      id: 'curation',
      label: 'Curation rewards',
      value: totalCurationRewards,
      share: totalCurationRewards / breakdownBase,
      colorToken: 'purple.solid',
    },
    {
      id: 'interest',
      label: 'HBD savings interest',
      value: totalSavingsInterest,
      share: totalSavingsInterest / breakdownBase,
      colorToken: 'orange.solid',
    },
  ]
  const breakdown = breakdownItems.filter(
    (item) => item.value > 0 || totalRewards === 0,
  )
  const publishedPosts = buckets.reduce(
    (total, bucket) => total + bucket.posts,
    0,
  )
  const payoutDistribution = buckets.map((bucket) => {
    const distributionBucket = payoutDistributionMap.get(bucket.key)

    return {
      key: bucket.key,
      shortLabel: bucket.shortLabel,
      longLabel: bucket.longLabel,
      rewards: distributionBucket
        ? distributionBucket.rewards.slice().sort((left, right) => left - right)
        : [],
    }
  })
  const communityRewardBreakdown = Array.from(communityRewardMap.values())
    .filter((community) => community.totalRewards > 0)
    .sort((left, right) => right.totalRewards - left.totalRewards)
  const averagePostReward =
    publishedPosts > 0 ? currentPostRewardTotal / publishedPosts : 0
  const previousAveragePostReward =
    previousPublishedPosts > 0
      ? previousPostRewardTotal / previousPublishedPosts
      : 0

  return {
    range,
    bucketUnit: RANGE_BUCKET_CONFIG[range].bucketUnit,
    buckets,
    dailyIncome,
    dailyPostCounts,
    outgoingDelegations: delegationSummary,
    breakdown,
    incomeBreakdown,
    payoutDistribution,
    communityRewardBreakdown,
    summary: {
      totalRewards,
      totalRewardsChange: toPercentChange(totalRewards, previousTotalRewards),
      averagePostReward,
      averagePostRewardChange: toPercentChange(
        averagePostReward,
        previousAveragePostReward,
      ),
      publishedPosts,
    },
    performancePosts: topPosts
      .slice()
      .sort((left, right) => right.totalReward - left.totalReward),
    topPosts: topPosts
      .sort((left, right) => right.totalReward - left.totalReward)
      .slice(0, 5),
    cachedAt: now.getTime(),
  }
}

export async function fetchDashboardOverview(
  username: string,
  range: DashboardRange,
  now = new Date(),
): Promise<DashboardHistoricalOverview> {
  const normalized = normalizeUsername(username)
  if (!normalized) {
    throw new Error('A Hive account name is required')
  }

  const [posts, comments, outgoingDelegations, rewardHistory, chainState] =
    await Promise.all([
    fetchDashboardPosts(normalized, range),
    fetchDashboardComments(normalized, range),
    fetchOutgoingDelegations(normalized),
    fetchRewardHistory(normalized, range),
    fetchDynamicProperties(),
    ])

  return aggregateDashboardOverview({
    username: normalized,
    posts,
    comments,
    outgoingDelegations,
    range,
    rewardHistory,
    properties: chainState.properties,
    hivePriceHbd: chainState.hivePriceHbd,
    now,
  })
}
