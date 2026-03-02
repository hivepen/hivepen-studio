import { useQuery } from '@tanstack/react-query'
import { getPostQueryOptions, type Entry } from '@ecency/sdk'
import { sumAssetStrings } from '@/lib/hive/payouts'

type PostPayoutSummary = {
  pending: string
  total: string
  author: string
  curator: string
  isPaidOut: boolean
}

type PostViewModel = {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  updated?: string
  community?: string
  tags: string[]
  votes?: number
  comments?: number
  category?: string
  app?: string
  payoutAt?: string
  beneficiaries?: Entry['beneficiaries']
  payout: PostPayoutSummary
}

const resolveTags = (metadata: Entry['json_metadata']) => {
  if (!metadata || !Array.isArray(metadata.tags)) return []
  return metadata.tags
}

const resolveApp = (metadata: Entry['json_metadata']) => {
  if (!metadata || typeof metadata.app !== 'string') return undefined
  const [app] = metadata.app.split('/')
  return app?.trim() || undefined
}

const buildPayoutSummary = (entry: Entry): PostPayoutSummary => {
  const totalFromPayouts = sumAssetStrings(
    entry.author_payout_value,
    entry.curator_payout_value
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
    community: entry.community,
    tags: resolveTags(entry.json_metadata),
    votes,
    comments: entry.children,
    category: entry.category,
    app: resolveApp(entry.json_metadata),
    payoutAt: entry.payout_at,
    beneficiaries: entry.beneficiaries,
    payout: buildPayoutSummary(entry),
  }
}

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
  })
}
