import { VoteDetail } from '@/lib/posts/votes'
import { hiveClient } from './client'

type BridgeVote = {
  voter?: string
  percent?: number | string
  weight?: number | string
  rshares?: number | string
}

type BridgePost = {
  active_votes?: BridgeVote[]
}

const toNumber = (
  value: BridgeVote['percent'] | BridgeVote['weight'] | BridgeVote['rshares'],
) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed) {
      const parsed = Number(trimmed)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }
  return 0
}

const extractVoteDetails = (post: BridgePost | null | undefined) => {
  const activeVotes = Array.isArray(post?.active_votes)
    ? post.active_votes
    : []

  const voteDetails = activeVotes
    .map((vote) => {
      const account = typeof vote.voter === 'string' ? vote.voter : ''
      if (!account) return null
      const percent = toNumber(vote.percent)
      const weight = toNumber(vote.weight)
      const rshares = toNumber(vote.rshares)
      return {
        account,
        percent,
        weight,
        rshares,
      }
    })
    .filter(
      (
        vote,
      ): vote is VoteDetail & { weight?: number; rshares?: number } =>
        Boolean(vote),
    )

  const totalAbsRshares = voteDetails.reduce((total, vote) => {
    const rshares = vote.rshares ?? 0
    return total + Math.abs(rshares)
  }, 0)

  return voteDetails.map((vote) => {
    if (vote.percent) {
      return { account: vote.account, percent: vote.percent }
    }
    if (vote.weight) {
      return { account: vote.account, percent: vote.weight }
    }
    if (vote.rshares && totalAbsRshares > 0) {
      const ratio = (vote.rshares / totalAbsRshares) * 100
      return { account: vote.account, percent: ratio }
    }
    return { account: vote.account, percent: 0 }
  })
}

export async function fetchPostVoteDetails({
  author,
  permlink,
}: {
  author: string
  permlink: string
}): Promise<VoteDetail[]> {
  try {
    const result = await hiveClient.hivemind.call('get_post', {
      author,
      permlink,
    })
    const post = Array.isArray(result) ? result[0] : result
    return extractVoteDetails(post)
  } catch {
    try {
      const result = await hiveClient.hivemind.call('get_discussion', {
        author,
        permlink,
      })
      const post = Array.isArray(result) ? result[0] : result
      return extractVoteDetails(post)
    } catch {
      return []
    }
  }
}
