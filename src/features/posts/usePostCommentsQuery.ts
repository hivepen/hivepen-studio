import { useQuery } from '@tanstack/react-query'
import { fetchPostComments } from '@/lib/hive/comments'

export default function usePostCommentsQuery({
  author,
  permlink,
}: {
  author: string
  permlink: string
}) {
  return useQuery({
    queryKey: ['comments', author, permlink],
    queryFn: () => fetchPostComments({ author, permlink }),
    enabled: Boolean(author && permlink),
  })
}
