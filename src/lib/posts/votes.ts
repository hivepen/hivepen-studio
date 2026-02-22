export type VoteDetail = {
  account: string
  percent: number
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

export const formatVotePercent = (percent: number) => {
  const normalized = normalizeVotePercent(percent)
  return `${percentFormatter.format(normalized)}%`
}

export const sortVoteDetailsByPercent = (votes: VoteDetail[]) =>
  [...votes].sort(
    (a, b) => normalizeVotePercent(b.percent) - normalizeVotePercent(a.percent),
  )
