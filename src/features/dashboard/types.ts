import type { PostSearchResult } from '@/lib/hive/search'

export type DashboardRange = '1M' | '3M' | '6M' | '1Y'

export type DashboardBucketUnit = 'week' | 'month'

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

export type DashboardDailyIncomeDay = {
  date: string
  authorRewards: number
  curationRewards: number
  savingsInterest: number
  totalRewards: number
}

export type DashboardDailyPostCount = {
  date: string
  posts: number
  comments: number
}

export type DashboardBreakdownItem = {
  id: 'author' | 'curation' | 'interest'
  label: string
  value: number
  share: number
  colorToken: string
}

export type DashboardIncomeBreakdownCategoryId =
  | 'author'
  | 'curation'
  | 'interest'
  | 'witness'
  | 'transfers'

export type DashboardIncomeBreakdownSubcategoryId =
  | 'post_rewards'
  | 'comment_rewards'
  | 'curation_votes'
  | 'hbd_savings'
  | 'witness_blocks'
  | 'delegation_income'
  | 'other_transfers'

export type DashboardIncomeBreakdownSubcategory = {
  id: DashboardIncomeBreakdownSubcategoryId
  parentId: DashboardIncomeBreakdownCategoryId
  label: string
  value: number
  share: number
  colorToken: string
}

export type DashboardIncomeBreakdownCategory = {
  id: DashboardIncomeBreakdownCategoryId
  label: string
  value: number
  share: number
  colorToken: string
  subcategories: Array<DashboardIncomeBreakdownSubcategory>
}

export type DashboardTopPost = Pick<
  PostSearchResult,
  | 'author'
  | 'permlink'
  | 'title'
  | 'created'
  | 'coverUrl'
  | 'communityId'
  | 'communityTitle'
  | 'communityInfo'
> & {
  id: string
  totalReward: number
  authorReward: number
  votes: number
  comments: number
  primaryTag?: string
}

export type DashboardPayoutDistributionBucket = {
  key: string
  shortLabel: string
  longLabel: string
  rewards: Array<number>
}

export type DashboardCommunityRewardBreakdown = {
  id: string
  label: string
  postRewards: number
  commentRewards: number
  totalRewards: number
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
  buckets: Array<DashboardBucket>
  dailyIncome: Array<DashboardDailyIncomeDay>
  dailyPostCounts: Array<DashboardDailyPostCount>
  breakdown: Array<DashboardBreakdownItem>
  incomeBreakdown: Array<DashboardIncomeBreakdownCategory>
  summary: DashboardSummary
  payoutDistribution: Array<DashboardPayoutDistributionBucket>
  communityRewardBreakdown: Array<DashboardCommunityRewardBreakdown>
  performancePosts: Array<DashboardTopPost>
  topPosts: Array<DashboardTopPost>
  cachedAt: number
}

export type DashboardHistoricalSnapshot = DashboardHistoricalOverview & {
  username: string
  expiresAt: number
}
