import type { HiveAccountSearchResult } from '@/lib/hive/account'
import type { HiveCommunity } from '@/lib/hive/client'

export type DiscoveryEntityType = 'accounts' | 'communities'

export type DiscoveryEntityMap = {
  accounts: HiveAccountSearchResult
  communities: HiveCommunity
}

export type CachedEntity<T> = {
  key: string
  aliases: Array<string>
  value: T
  cachedAt: number
  expiresAt: number
}

export type CachedSearchBucket = {
  query: string
  keys: Array<string>
  cachedAt: number
  expiresAt: number
}

export type DiscoveryFrequencyEntry = {
  key: string
  count: number
  lastSelectedAt: number
}

export type DiscoveryRecentEntry = {
  key: string
  selectedAt: number
}

export type DiscoveryCacheCollection<T> = {
  entities: Record<string, CachedEntity<T>>
  buckets: Record<string, CachedSearchBucket>
  recent: Array<DiscoveryRecentEntry>
  frequency: Record<string, DiscoveryFrequencyEntry>
}

export type DiscoveryCacheState = {
  version: 1
  accounts: DiscoveryCacheCollection<HiveAccountSearchResult>
  communities: DiscoveryCacheCollection<HiveCommunity>
}

export type DiscoverySnapshot<T> = {
  query: string
  results: Array<T>
  cachedAt: number | null
  isStale: boolean
}

export type DiscoveryStorageLike = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>
