import { useQuery } from '@tanstack/react-query'
import {
  searchAccountPosts,
  searchRankedPosts,
  type RankedSort,
  type SearchResult,
} from '@/lib/hive/search'

export type PostsQueryParams = {
  source?: 'ranked' | 'account'
  sort: RankedSort | 'posts'
  tag?: string
  author?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
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

export default function usePostsQuery(params: PostsQueryParams) {
  const source = params.source ?? 'ranked'
  const tag = (params.tag ?? '').trim()
  const author = params.author?.trim()
  const maxRankedLimit = 20

  return useQuery({
    queryKey: ['posts', source, params.sort, tag, author, params.dateFrom, params.dateTo, params.limit],
    enabled: source === 'account' ? Boolean(author) : tag.length > 0,
    queryFn: async () => {
      if (source === 'account') {
        const results = await searchAccountPosts({
          account: author ?? '',
          limit: params.limit ?? 20,
        })
        return filterPosts(results, params)
      }

      const rankedLimit = Math.min(params.limit ?? maxRankedLimit, maxRankedLimit)
      const results = await searchRankedPosts({
        sort: params.sort as RankedSort,
        tag,
        limit: rankedLimit,
      })
      return filterPosts(results, params)
    },
  })
}
