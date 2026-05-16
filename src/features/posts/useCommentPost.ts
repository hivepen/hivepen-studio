import { useState } from 'react'
import type { Operation } from '@hiveio/dhive'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import { buildCommentOperations } from '@/lib/hive/operations'
import { m } from '@/paraglide/messages'

export default function useCommentPost({
  parentAuthor,
  parentPermlink,
}: {
  parentAuthor: string
  parentPermlink: string
}) {
  const { account, signAndBroadcastOperations } = useHiveWallet()
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

    const response = await signAndBroadcastOperations(
      operations as unknown as Array<Operation>,
      'Posting',
    )
    if (!response.success) {
      setError(response.error ?? m.post_actions_comment_failed())
    } else {
      setSuccess(true)
    }

    setIsCommenting(false)
    return response
  }

  return { comment, isCommenting, error, success }
}
