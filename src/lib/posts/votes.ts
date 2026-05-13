export type VoteDetail = {
  account: string
  percent: number
  rshares: number
}

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const normalizeVotePercent = (percent: number) => {
  if (!Number.isFinite(percent)) return 0
  const absolute = Math.abs(percent)
  if (absolute > 100 && absolute <= 10000) {
    return percent / 100
  }
  return percent
}

const getVoteSortValue = (vote: VoteDetail) => {
  if (vote.rshares) return Math.abs(vote.rshares)
  return Math.abs(normalizeVotePercent(vote.percent))
}

export const formatVotePercent = (percent: number) => {
  const normalized = normalizeVotePercent(percent)
  return `${percentFormatter.format(normalized)}%`
}

export const sortVoteDetailsByPercent = (votes: Array<VoteDetail>) =>
  [...votes].sort((a, b) => getVoteSortValue(b) - getVoteSortValue(a))
