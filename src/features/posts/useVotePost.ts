import { useState } from 'react'
import { broadcastOperations } from '@/lib/hive/keychain'
import { buildVoteOperation } from '@/lib/hive/operations'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'

export default function useVotePost({
  author,
  permlink,
}: {
  author: string
  permlink: string
}) {
  const [account] = useLocalStorageState<string | null>('hivepen.account', null)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const vote = async (weightPercent: number) => {
    if (!account) {
      setError('Connect Hive Keychain first.')
      return { success: false }
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

    const response = await broadcastOperations(account, operations, 'Posting')
    if (!response.success) {
      setError(response.message ?? 'Vote failed.')
    } else {
      setSuccess(true)
    }

    setIsVoting(false)
    return response
  }

  return { vote, isVoting, error, success }
}
