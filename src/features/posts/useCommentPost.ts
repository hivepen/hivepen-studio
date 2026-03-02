import { useState } from 'react'
import { broadcastOperations } from '@/lib/hive/keychain'
import { buildCommentOperations } from '@/lib/hive/operations'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { m } from '@/paraglide/messages'

export default function useCommentPost({
  parentAuthor,
  parentPermlink,
}: {
  parentAuthor: string
  parentPermlink: string
}) {
  const [account] = useLocalStorageState<string | null>('hivepen.account', null)
  const [isCommenting, setIsCommenting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const comment = async (body: string) => {
    if (!account) {
      setError(m.editor_status_keychain_required())
      return { success: false }
    }

    if (!body.trim()) {
      setError(m.post_actions_comment_empty())
      return { success: false }
    }

    setIsCommenting(true)
    setError(null)
    setSuccess(false)

    const operations = buildCommentOperations({
      author: account,
      parentAuthor,
      parentPermlink,
      body: body.trim(),
    })

    const response = await broadcastOperations(account, operations, 'Posting')
    if (!response.success) {
      setError(response.message ?? m.post_actions_comment_failed())
    } else {
      setSuccess(true)
    }

    setIsCommenting(false)
    return response
  }

  return { comment, isCommenting, error, success }
}
