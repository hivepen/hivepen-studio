import { getAccountPosts } from '@ecency/sdk'
import type { SearchResult } from '@/lib/hive/search'
import type {
  AccountRewardTimelineData,
  AccountRewardTimelineSnapshot,
  RewardSummary,
  RewardTimelinePoint,
} from './types'
import { parseAssetAmount } from '@/lib/hive/payouts'
import { mapEntryToSearchResult } from '@/features/posts/postMapping'

const ANALYTICS_STORAGE_KEY = 'hivepen.analytics.reward-timeline.v1'
export const ANALYTICS_TTL_MS = 24 * 60 * 60 * 1000

const MONTHS_TO_TRACK = 12
const PAGE_SIZE = 20
const MAX_PAGES = 30

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const normalizeUsername = (value: string) =>
  value.trim().replace(/^@/, '').toLowerCase()

const toMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, '0')}`

const startOfTrackedWindow = (now = new Date()) =>
  new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (MONTHS_TO_TRACK - 1),
      1,
    ),
  )

const buildTimelineSeed = (symbol: string, now = new Date()) => {
  const points: Array<RewardTimelinePoint> = []
  for (let offset = MONTHS_TO_TRACK - 1; offset >= 0; offset -= 1) {
    const current = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1),
    )
    points.push({
      month: toMonthKey(current),
      shortLabel: current.toLocaleDateString(undefined, { month: 'short' }),
      longLabel: current.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      }),
      totalAmount: 0,
      postCount: 0,
      symbol,
    })
  }
  return points
}

const readSnapshots = () => {
  const storage = getStorage()
  if (!storage) return {}

  try {
    const raw = storage.getItem(ANALYTICS_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, AccountRewardTimelineSnapshot>
  } catch {
    return {}
  }
}

const writeSnapshots = (
  snapshots: Record<string, AccountRewardTimelineSnapshot>,
) => {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(snapshots))
}

export const readRewardTimelineSnapshot = (username: string) => {
  const normalized = normalizeUsername(username)
  if (!normalized) return null
  const snapshot = readSnapshots()[normalized]
  if (!snapshot) return null
  if (snapshot.expiresAt <= Date.now()) return null
  return snapshot
}

export const writeRewardTimelineSnapshot = (
  username: string,
  data: AccountRewardTimelineData,
) => {
  const normalized = normalizeUsername(username)
  if (!normalized) return
  const snapshots = readSnapshots()
  snapshots[normalized] = {
    ...data,
    username: normalized,
    expiresAt: data.cachedAt + ANALYTICS_TTL_MS,
  }
  writeSnapshots(snapshots)
}

const resolveRewardAsset = (post: SearchResult) => {
  const value = post.payout?.total || post.payout?.pending
  return value ? parseAssetAmount(value) : null
}

export const aggregateMonthlyPostRewards = (
  posts: Array<SearchResult>,
  now = new Date(),
): AccountRewardTimelineData => {
  const trackedStart = startOfTrackedWindow(now)
  const firstReward = posts
    .map(resolveRewardAsset)
    .find((asset): asset is NonNullable<typeof asset> => Boolean(asset))
  const symbol = firstReward?.symbol ?? 'HBD'
  const timeline = buildTimelineSeed(symbol, now)
  const pointsByMonth = new Map(timeline.map((point) => [point.month, point]))

  posts.forEach((post) => {
    const createdAt = new Date(post.created)
    if (Number.isNaN(createdAt.getTime()) || createdAt < trackedStart) {
      return
    }

    const reward = resolveRewardAsset(post)
    if (!reward || reward.symbol !== symbol) return

    const point = pointsByMonth.get(toMonthKey(createdAt))
    if (!point) return

    point.totalAmount += reward.amount
    point.postCount += 1
  })

  const trackedPostCount = timeline.reduce(
    (total, point) => total + point.postCount,
    0,
  )
  const totalRewardAmount = timeline.reduce(
    (total, point) => total + point.totalAmount,
    0,
  )
  const summary: RewardSummary = {
    totalRewardAmount,
    averageRewardAmount:
      trackedPostCount > 0 ? totalRewardAmount / trackedPostCount : 0,
    trackedPostCount,
    symbol,
  }

  return {
    timeline,
    summary,
    cachedAt: now.getTime(),
  }
}

export const fetchAccountRewardTimeline = async (
  username: string,
): Promise<AccountRewardTimelineData> => {
  const normalized = normalizeUsername(username)
  const trackedStart = startOfTrackedWindow()
  const collected = new Map<string, SearchResult>()
  let startAuthor: string | undefined
  let startPermlink: string | undefined

  for (let pageIndex = 0; pageIndex < MAX_PAGES; pageIndex += 1) {
    const entries = await getAccountPosts(
      'posts',
      normalized,
      startAuthor,
      startPermlink,
      PAGE_SIZE,
    )

    if (!entries || entries.length === 0) break

    entries.forEach((entry) => {
      const mapped = mapEntryToSearchResult(entry)
      collected.set(`${mapped.author}/${mapped.permlink}`, mapped)
    })

    const lastEntry = entries[entries.length - 1]
    if (!lastEntry) break

    const oldestCreated = new Date(lastEntry.created)
    if (Number.isNaN(oldestCreated.getTime()) || oldestCreated < trackedStart) {
      break
    }

    if (entries.length < PAGE_SIZE) {
      break
    }

    startAuthor = lastEntry.author
    startPermlink = lastEntry.permlink
  }

  return aggregateMonthlyPostRewards(Array.from(collected.values()))
}

export { ANALYTICS_STORAGE_KEY }
