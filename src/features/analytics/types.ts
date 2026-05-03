export type RewardTimelinePoint = {
  month: string
  shortLabel: string
  longLabel: string
  totalAmount: number
  postCount: number
  symbol: string
}

export type RewardSummary = {
  totalRewardAmount: number
  averageRewardAmount: number
  trackedPostCount: number
  symbol: string
}

export type AccountRewardTimelineData = {
  timeline: Array<RewardTimelinePoint>
  summary: RewardSummary
  cachedAt: number
}

export type AccountRewardTimelineSnapshot = AccountRewardTimelineData & {
  username: string
  expiresAt: number
}
