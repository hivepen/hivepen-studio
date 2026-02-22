import { useEffect, useRef, useState } from 'react'
import { fetchPostVoteDetails } from '@/lib/hive/votes'
import { VoteDetail } from '@/lib/posts/votes'

type UsePostVoteDetailsArgs = {
  author?: string
  permlink?: string
  enabled?: boolean
  initialVoteDetails?: VoteDetail[]
}

type UsePostVoteDetailsResult = {
  voteDetails: VoteDetail[]
  loading: boolean
  error: Error | null
}

export default function usePostVoteDetails({
  author,
  permlink,
  enabled = false,
  initialVoteDetails,
}: UsePostVoteDetailsArgs): UsePostVoteDetailsResult {
  const [voteDetails, setVoteDetails] = useState<VoteDetail[]>(
    () => initialVoteDetails ?? [],
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inFlightRef = useRef(false)
  const hasInitialRef = useRef(Boolean(initialVoteDetails?.length))

  useEffect(() => {
    if (!initialVoteDetails?.length) return
    if (hasInitialRef.current) return
    hasInitialRef.current = true
    setVoteDetails(initialVoteDetails)
  }, [initialVoteDetails])

  useEffect(() => {
    if (!enabled) return
    if (!author || !permlink) return
    if (hasInitialRef.current) return
    if (inFlightRef.current) return

    let cancelled = false
    inFlightRef.current = true
    setLoading(true)
    setError(null)

    fetchPostVoteDetails({ author, permlink })
      .then((details) => {
        if (cancelled) return
        setVoteDetails(details)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error('Failed to load votes'))
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
        inFlightRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [author, enabled, permlink])

  return { voteDetails, loading, error }
}
