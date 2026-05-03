import type {Entry} from '@ecency/sdk';
import type {SearchResult} from '@/lib/hive/search';
import { sumAssetStrings } from '@/lib/hive/payouts'

const resolveMetadata = (metadata: Entry['json_metadata']) => {
  if (!metadata) return {}
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata)
    } catch {
      return {}
    }
  }
  return metadata
}

export const mapEntryToSearchResult = (entry: Entry): SearchResult => {
  const metadata = resolveMetadata(entry.json_metadata)
  const tags = Array.isArray(metadata?.tags) ? metadata.tags : []
  const imageList = Array.isArray(metadata?.image) ? metadata.image : []
  const coverUrl = typeof imageList[0] === 'string' ? imageList[0] : undefined
  const summary =
    typeof metadata?.description === 'string' ? metadata.description : undefined
  const app =
    typeof metadata?.app === 'string'
      ? metadata.app.split('/')[0]?.trim() || undefined
      : undefined
  const pendingPayout =
    typeof entry.pending_payout_value === 'string'
      ? entry.pending_payout_value
      : undefined
  const authorPayout =
    typeof entry.author_payout_value === 'string'
      ? entry.author_payout_value
      : undefined
  const curatorPayout =
    typeof entry.curator_payout_value === 'string'
      ? entry.curator_payout_value
      : undefined
  const totalPayout =
    authorPayout && curatorPayout
      ? sumAssetStrings(authorPayout, curatorPayout)
      : pendingPayout
  const payout =
    pendingPayout || totalPayout
      ? {
          pending: pendingPayout ?? totalPayout ?? '',
          total: totalPayout ?? pendingPayout ?? '',
        }
      : undefined

  return {
    author: entry.author,
    permlink: entry.permlink,
    title: entry.title,
    created: entry.created,
    tags,
    community: entry.community,
    communityTitle: entry.community_title,
    summary,
    coverUrl,
    app,
    payout,
    votes:
      typeof entry.total_votes === 'number'
        ? entry.total_votes
        : typeof entry.stats?.total_votes === 'number'
          ? entry.stats.total_votes
          : Array.isArray(entry.active_votes)
            ? entry.active_votes.length
            : undefined,
    comments: typeof entry.children === 'number' ? entry.children : undefined,
  }
}
