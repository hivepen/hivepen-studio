import { useQuery } from '@tanstack/react-query'
import { fetchPost } from '@/lib/hive/post'

export default function usePostQuery({
  author,
  permlink,
}: {
  author: string
  permlink: string
}) {
  return useQuery({
    queryKey: ['post', author, permlink],
    queryFn: () => fetchPost({ author, permlink }),
    enabled: Boolean(author && permlink),
  })
}
