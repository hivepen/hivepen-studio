import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getAccountPostsInfiniteQueryOptions,
  getPostsRankedInfiniteQueryOptions,
  type Entry,
} from '@ecency/sdk'
import { sumAssetStrings } from '@/lib/hive/payouts'
import { type SearchResult } from '@/lib/hive/search'
import type { PostsQueryParams } from '@/features/posts/usePostsQuery'

export type PostsPage = SearchResult[]

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

const mapEntryToSearchResult = (entry: Entry): SearchResult => {
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

const filterPosts = (posts: SearchResult[], params: PostsQueryParams) => {
  const author = params.author?.trim()
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : null
  const dateTo = params.dateTo ? new Date(params.dateTo) : null

  return posts.filter((post) => {
    if (author && post.author !== author) return false
    if (dateFrom && new Date(post.created) < dateFrom) return false
    if (dateTo && new Date(post.created) > dateTo) return false
    return true
  })
}

export default function useInfinitePostsQuery(params: PostsQueryParams) {
  const source = params.source ?? 'ranked'
  const tag = (params.tag ?? '').trim()
  const author = params.author?.trim()
  const pageSize = Math.min(params.limit ?? 20, 20)
  const enabled = source === 'account' ? Boolean(author) : tag.length > 0

  const baseOptions =
    source === 'account'
      ? getAccountPostsInfiniteQueryOptions(author, 'posts', pageSize, undefined, enabled)
      : getPostsRankedInfiniteQueryOptions(params.sort, tag, pageSize, undefined, enabled)

  return useInfiniteQuery({
    ...(baseOptions as object),
    enabled,
    select: (data: any) => ({
      ...data,
      pages: data.pages.map((page: Entry[]) =>
        filterPosts(page.map(mapEntryToSearchResult), params)
      ),
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
