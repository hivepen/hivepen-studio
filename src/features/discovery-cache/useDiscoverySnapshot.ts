import { useCallback, useEffect, useState } from 'react'
import { discoveryCache } from './index'
import type { DiscoveryEntityMap, DiscoveryEntityType, DiscoverySnapshot } from './types'

export default function useDiscoverySnapshot<T extends DiscoveryEntityType>(
  type: T,
  query: string,
  limit: number
) {
  const [snapshot, setSnapshot] = useState<DiscoverySnapshot<DiscoveryEntityMap[T]>>(
    () => discoveryCache.getSnapshot(type, query, limit)
  )

  useEffect(() => {
    setSnapshot(discoveryCache.getSnapshot(type, query, limit))
  }, [limit, query, type])

  const refresh = useCallback(() => {
    setSnapshot(discoveryCache.getSnapshot(type, query, limit))
  }, [limit, query, type])

  return { snapshot, refresh }
}
