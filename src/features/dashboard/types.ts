export type DashboardRange = '1M' | '3M' | '6M' | '1Y'

export type DashboardBucketUnit = 'week' | 'month'

export type DashboardChartKind = 'line' | 'bar'

export type DashboardBucket = {
  key: string
  shortLabel: string
  longLabel: string
  startAt: string
  endAt: string
  authorRewards: number
  curationRewards: number
  savingsInterest: number
  totalRewards: number
  posts: number
  votes: number
  comments: number
}

export type DashboardBreakdownItem = {
  id: 'author' | 'curation' | 'interest'
  label: string
  value: number
  share: number
  colorToken: string
}

export type DashboardTopPost = {
  id: string
  author: string
  permlink: string
  title: string
  created: string
  totalReward: number
  authorReward: number
  votes: number
  comments: number
  primaryTag?: string
}

export type DashboardSummary = {
  totalRewards: number
  totalRewardsChange: number | null
  averagePostReward: number
  averagePostRewardChange: number | null
  publishedPosts: number
}

export type DashboardHistoricalOverview = {
  range: DashboardRange
  bucketUnit: DashboardBucketUnit
  rewardIncomeChartKind: DashboardChartKind
  rewardTrendChartKind: DashboardChartKind
  engagementChartKind: DashboardChartKind
  buckets: Array<DashboardBucket>
  breakdown: Array<DashboardBreakdownItem>
  summary: DashboardSummary
  topPosts: Array<DashboardTopPost>
  cachedAt: number
}

export type DashboardHistoricalSnapshot = DashboardHistoricalOverview & {
  username: string
  expiresAt: number
}
