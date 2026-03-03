import { useInfiniteQuery } from '@tanstack/react-query'
import {
  searchAccountPosts,
  searchRankedPosts,
  type RankedSort,
  type SearchResult,
} from '@/lib/hive/search'
import type { PostsQueryParams } from '@/features/posts/usePostsQuery'

export type PostsPageCursor = {
  author: string
  permlink: string
}

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

  return useInfiniteQuery<PostsPage, Error, PostsPage, Array<unknown>, PostsPageCursor | undefined>({
    queryKey: [
      'posts',
      'infinite',
      source,
      params.sort,
      tag,
      author,
      params.dateFrom,
      params.dateTo,
      pageSize,
    ],
    initialPageParam: undefined,
    enabled: source === 'account' ? Boolean(author) : tag.length > 0,
    queryFn: async ({ pageParam }) => {
      if (source === 'account') {
        const results = await searchAccountPosts({
          account: author ?? '',
          limit: pageSize,
          startAuthor: pageParam?.author,
          startPermlink: pageParam?.permlink,
        })
        return filterPosts(results, params)
      }

      const results = await searchRankedPosts({
        sort: params.sort as RankedSort,
        tag,
        limit: pageSize,
        startAuthor: pageParam?.author,
        startPermlink: pageParam?.permlink,
      })
      return filterPosts(results, params)
    },
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const minLengthForNext = lastPageParam
        ? Math.max(pageSize - 1, 1)
        : pageSize
      if (lastPage.length < minLengthForNext) return undefined
      const last = lastPage[lastPage.length - 1]
      if (!last) return undefined
      return { author: last.author, permlink: last.permlink }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
