import { useQuery } from '@tanstack/react-query'
import { getPostQueryOptions } from '@ecency/sdk'
import {
  resolveApp,
  resolveTags,
  resolveImages,
  resolveCoverImageUrl,
} from './postMetadataUtils'
import type { Entry } from '@ecency/sdk'
import { sumAssetStrings } from '@/lib/hive/payouts'
import type { VoteDetail } from '@/lib/posts/votes'
import { extractVoteDetails } from '@/lib/hive/votes'

type PostPayoutSummary = {
  pending: string
  total: string
  author: string
  curator: string
  isPaidOut: boolean
}
export type CommunityId = `hive-${string}` | string
export type CommunityInfo = { id: CommunityId; name?: string }
export type PostViewModel = {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  updated?: string
  communityId?: CommunityId
  communityTitle?: string
  communityInfo?: CommunityInfo
  tags: Array<string>
  votesCount?: number
  commentsCount?: number
  category?: string
  app?: string
  payoutAt?: string
  beneficiaries?: Entry['beneficiaries']
  payout: PostPayoutSummary
  coverImageUrl?: string
  images: Array<string>
  voteDetails?: Array<VoteDetail>
}

const buildPayoutSummary = (entry: Entry): PostPayoutSummary => {
  const totalFromPayouts = sumAssetStrings(
    entry.author_payout_value,
    entry.curator_payout_value,
  )

  return {
    pending: entry.pending_payout_value,
    total: totalFromPayouts ?? entry.pending_payout_value,
    author: entry.author_payout_value,
    curator: entry.curator_payout_value,
    isPaidOut: entry.is_paidout,
  }
}

const mapEntryToPost = (entry: Entry): PostViewModel => {
  const votes =
    typeof entry.total_votes === 'number'
      ? entry.total_votes
      : entry.active_votes?.length

  return {
    author: entry.author,
    permlink: entry.permlink,
    title: entry.title,
    body: entry.body,
    created: entry.created,
    updated: entry.updated,
    communityId: entry.community,
    communityTitle: entry.community_title,
    // community: {id: entry.community, title: entry.community_title},
    tags: resolveTags(entry.json_metadata),
    votesCount: votes,
    commentsCount: entry.children,
    category: entry.category,
    app: resolveApp(entry.json_metadata),
    payoutAt: entry.payout_at,
    beneficiaries: entry.beneficiaries,
    payout: buildPayoutSummary(entry),
    coverImageUrl: resolveCoverImageUrl(entry.json_metadata),
    images: resolveImages(entry.json_metadata),
    voteDetails: Array.isArray(entry.active_votes)
      ? extractVoteDetails({ active_votes: entry.active_votes })
      : undefined,
  }
}

export { mapEntryToPost, buildPayoutSummary }

export default function usePostQuery({
  author,
  permlink,
}: {
  author: string
  permlink: string
}) {
  return useQuery({
    ...getPostQueryOptions(author, permlink),
    enabled: Boolean(author && permlink),
    select: (entry) => (entry ? mapEntryToPost(entry) : null),
    staleTime: 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
