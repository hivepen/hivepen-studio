import { useState } from 'react'
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
      const error = m.editor_status_keychain_required()
      setError(error)
      return { success: false as const, error }
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

    const response = await signAndBroadcastOperations(operations, 'Posting')
    if (!response.success) {
      const error = response.error ?? m.post_actions_vote_failed()
      setError(error)
      setIsVoting(false)
      return { success: false as const, error }
    } else {
      setSuccess(true)
    }

    setIsVoting(false)
    return response
  }

  return { vote, isVoting, error, success }
}
