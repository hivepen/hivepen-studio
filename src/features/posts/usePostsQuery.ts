import { useQuery } from '@tanstack/react-query'
import {
  getAccountPostsQueryOptions,
  getPostsRankedQueryOptions,
} from '@ecency/sdk'
import type { Entry } from '@ecency/sdk'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import type { RankedSort, PostSearchResult } from '@/lib/hive/search'
import { mapEntryToSearchResult } from '@/features/posts/postMapping'

export type PostsQueryParams = {
  source?: 'ranked' | 'account'
  sort: RankedSort | 'posts'
  tag?: string
  author?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

const filterPosts = (
  posts: Array<PostSearchResult>,
  params: PostsQueryParams,
) => {
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

export default function usePostsQuery(params: PostsQueryParams) {
  const { activeAccount } = useHiveWallet()
  const source = params.source ?? 'ranked'
  const tag = (params.tag ?? '').trim()
  const author = params.author?.trim()
  const observer = activeAccount?.trim() || undefined
  const pageSize = Math.min(params.limit ?? 20, 20)
  const enabled = source === 'account' ? Boolean(author) : tag.length > 0

  return useQuery({
    queryKey: [
      'posts',
      source,
      params.sort,
      tag,
      author,
      observer,
      params.dateFrom,
      params.dateTo,
      params.limit,
    ],
    ...(source === 'account'
      ? (getAccountPostsQueryOptions(
          author,
          'posts',
          undefined,
          undefined,
          pageSize,
          undefined,
          enabled,
        ) as object)
      : (getPostsRankedQueryOptions(
          params.sort,
          undefined,
          undefined,
          pageSize,
          tag,
          observer,
          enabled,
        ) as object)),
    enabled,
    select: (data: Array<Entry>) =>
      filterPosts(data.map(mapEntryToSearchResult), params),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
