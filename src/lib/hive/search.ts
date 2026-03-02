import { hiveClient } from './client'
import { sumAssetStrings } from './payouts'

type RankedPost = {
  author: string
  permlink: string
  title: string
  created: string
  community?: string
  community_title?: string
  net_votes?: number
  children?: number
  stats?: { total_votes?: number }
  active_votes?: Array<{ voter: string }>
  json_metadata?: string | { tags?: string[] }
  pending_payout_value?: string
  author_payout_value?: string
  curator_payout_value?: string
}

export type SearchResult = {
  author: string
  permlink: string
  title: string
  created: string
  tags: string[]
  community?: string
  communityTitle?: string
  summary?: string
  coverUrl?: string
  app?: string
  votes?: number
  comments?: number
  payout?: {
    pending: string
    total: string
  }
}

export type RankedSort =
  | 'trending'
  | 'hot'
  | 'created'
  | 'promoted'
  | 'payout'
  | 'payout_comments'
  | 'muted'

export async function searchRankedPosts({
  sort,
  tag,
  limit,
}: {
  sort: RankedSort
  tag: string
  limit: number
}) {
  const response = await hiveClient.hivemind.getRankedPosts({
    sort,
    tag,
    limit,
  })
  const result = (Array.isArray(response)
    ? response
    : (response as { result?: RankedPost[]; posts?: RankedPost[] })?.result ??
      (response as { posts?: RankedPost[] })?.posts ??
      []) as RankedPost[]

  return result.map((post) => {
    const metadata =
      typeof post.json_metadata === 'string'
        ? (() => {
            try {
              return JSON.parse(post.json_metadata)
            } catch {
              return {}
            }
          })()
        : post.json_metadata ?? {}
    const tags = Array.isArray(metadata?.tags) ? metadata.tags : []
    const imageList = Array.isArray(metadata?.image) ? metadata.image : []
    const coverUrl =
      typeof imageList[0] === 'string' ? imageList[0] : undefined
    const summary =
      typeof metadata?.description === 'string' ? metadata.description : undefined
    const app =
      typeof metadata?.app === 'string'
        ? metadata.app.split('/')[0]?.trim() || undefined
        : undefined
    const pendingPayout =
      typeof post.pending_payout_value === 'string'
        ? post.pending_payout_value
        : undefined
    const authorPayout =
      typeof post.author_payout_value === 'string'
        ? post.author_payout_value
        : undefined
    const curatorPayout =
      typeof post.curator_payout_value === 'string'
        ? post.curator_payout_value
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
      author: post.author,
      permlink: post.permlink,
      title: post.title,
      created: post.created,
      tags,
      community: post.community,
      communityTitle: post.community_title,
      summary,
      coverUrl,
      app,
      payout,
      votes:
        typeof post.net_votes === 'number'
          ? post.net_votes
          : typeof post.stats?.total_votes === 'number'
            ? post.stats.total_votes
            : Array.isArray(post.active_votes)
              ? post.active_votes.length
            : undefined,
      comments: typeof post.children === 'number' ? post.children : undefined,
    }
  })
}

export async function searchAccountPosts({
  account,
  limit,
}: {
  account: string
  limit: number
}) {
  const response = await hiveClient.hivemind.getAccountPosts({
    account,
    sort: 'posts',
    limit,
  })
  const result = (Array.isArray(response)
    ? response
    : (response as { result?: RankedPost[]; posts?: RankedPost[] })?.result ??
      (response as { posts?: RankedPost[] })?.posts ??
      []) as RankedPost[]

  return result.map((post) => {
    const metadata =
      typeof post.json_metadata === 'string'
        ? (() => {
            try {
              return JSON.parse(post.json_metadata)
            } catch {
              return {}
            }
          })()
        : post.json_metadata ?? {}
    const tags = Array.isArray(metadata?.tags) ? metadata.tags : []
    const imageList = Array.isArray(metadata?.image) ? metadata.image : []
    const coverUrl =
      typeof imageList[0] === 'string' ? imageList[0] : undefined
    const summary =
      typeof metadata?.description === 'string' ? metadata.description : undefined
    const app =
      typeof metadata?.app === 'string'
        ? metadata.app.split('/')[0]?.trim() || undefined
        : undefined
    const pendingPayout =
      typeof post.pending_payout_value === 'string'
        ? post.pending_payout_value
        : undefined
    const authorPayout =
      typeof post.author_payout_value === 'string'
        ? post.author_payout_value
        : undefined
    const curatorPayout =
      typeof post.curator_payout_value === 'string'
        ? post.curator_payout_value
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
      author: post.author,
      permlink: post.permlink,
      title: post.title,
      created: post.created,
      tags,
      community: post.community,
      communityTitle: post.community_title,
      summary,
      coverUrl,
      app,
      payout,
      votes:
        typeof post.net_votes === 'number'
          ? post.net_votes
          : typeof post.stats?.total_votes === 'number'
            ? post.stats.total_votes
            : Array.isArray(post.active_votes)
              ? post.active_votes.length
            : undefined,
      comments: typeof post.children === 'number' ? post.children : undefined,
    }
  })
}
