import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getAccountPostsInfiniteQueryOptions,
  getPostsRankedInfiniteQueryOptions,
} from '@ecency/sdk'
import type { Entry } from '@ecency/sdk'
import type { PostsQueryParams } from '@/features/posts/usePostsQuery'
import type { PostSearchResult } from '@/lib/hive/search'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import { mapEntryToSearchResult } from '@/features/posts/postMapping'

export type PostsPage = Array<PostSearchResult>

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

export default function useInfinitePostsQuery(params: PostsQueryParams) {
  const { activeAccount } = useHiveWallet()
  const source = params.source ?? 'ranked'
  const tag = (params.tag ?? '').trim()
  const author = params.author?.trim()
  const observer = activeAccount?.trim() || undefined
  const pageSize = Math.min(params.limit ?? 20, 20)
  const enabled = source === 'account' ? Boolean(author) : tag.length > 0

  const baseOptions =
    source === 'account'
      ? getAccountPostsInfiniteQueryOptions(
          author,
          'posts',
          pageSize,
          undefined,
          enabled,
        )
      : getPostsRankedInfiniteQueryOptions(
          params.sort,
          tag,
          pageSize,
          observer,
          enabled,
        )

  return useInfiniteQuery({
    ...baseOptions,
    enabled,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page: Array<Entry>) =>
        filterPosts(page.map(mapEntryToSearchResult), params),
      ),
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
