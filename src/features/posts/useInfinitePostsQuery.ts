import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getAccountPostsInfiniteQueryOptions,
  getPostsRankedInfiniteQueryOptions,
  type Entry,
} from '@ecency/sdk'
import { type SearchResult } from '@/lib/hive/search'
import type { PostsQueryParams } from '@/features/posts/usePostsQuery'
import { mapEntryToSearchResult } from '@/features/posts/postMapping'

export type PostsPage = SearchResult[]

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
