import { useState } from 'react'
import type { Operation } from '@hiveio/dhive'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import { buildVoteOperation } from '@/lib/hive/operations'
import { m } from '@/paraglide/messages'

export default function useVotePost({
  author,
  permlink,
}: {
  author: string
  permlink: string
}) {
  const { account, signAndBroadcastOperations } = useHiveWallet()
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const vote = async (weightPercent: number) => {
    if (!account) {
      const missingAccountError = m.editor_status_keychain_required()
      setError(missingAccountError)
      return { success: false as const, error: missingAccountError }
    }

    setIsVoting(true)
    setError(null)
    setSuccess(false)

    const weight = Math.max(0, Math.min(100, Math.round(weightPercent))) * 100
    const operations = [
      buildVoteOperation({
        voter: account,
        author,
        permlink,
        weight,
      }),
    ]

    const response = await signAndBroadcastOperations(
      operations as unknown as Array<Operation>,
      'Posting',
    )
    if (!response.success) {
      const voteError = response.error ?? m.post_actions_vote_failed()
      setError(voteError)
      setIsVoting(false)
      return { success: false as const, error: voteError }
    } else {
      setSuccess(true)
    }

    setIsVoting(false)
    return response
  }

  return { vote, isVoting, error, success }
}
