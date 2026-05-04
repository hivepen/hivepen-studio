import { resolveMetadata, resolveTags, resolveApp, resolveImages, resolveCoverImageUrl } from './postMetadataUtils'
import type {Entry} from '@ecency/sdk';
import type {PostSearchResult} from '@/lib/hive/search';
import { sumAssetStrings } from '@/lib/hive/payouts'

export const mapEntryToSearchResult = (entry: Entry): PostSearchResult => {
  const metadata = resolveMetadata(entry.json_metadata)
  const tags = resolveTags(entry.json_metadata)
  const images = resolveImages(entry.json_metadata)
  const coverImageUrl = resolveCoverImageUrl(entry.json_metadata)
  const summary =
    typeof metadata?.description === 'string' ? metadata.description : undefined
  const app = resolveApp(entry.json_metadata)
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
    communityId: entry.community,
    communityTitle: entry.community_title,
    communityInfo: { id: entry.community, name: entry.community_title },
    summary,
    coverUrl: coverImageUrl,
    images,
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
