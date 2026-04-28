import type { HiveAccountSearchResult } from '@/lib/hive/account'
import type { HiveCommunity } from '@/lib/hive/client'
import type {
  CachedEntity,
  CachedSearchBucket,
  DiscoveryCacheCollection,
  DiscoveryCacheState,
  DiscoveryEntityMap,
  DiscoveryEntityType,
  DiscoveryFrequencyEntry,
  DiscoveryRecentEntry,
  DiscoverySnapshot,
  DiscoveryStorageLike,
} from './types'

const STORAGE_KEY = 'hivepen.discovery-cache.v1'
const ENTITY_TTL_MS = 7 * 24 * 60 * 60 * 1000
const SEARCH_BUCKET_TTL_MS = 30 * 24 * 60 * 60 * 1000
const RECENT_LIMIT = 50
const FREQUENT_LIMIT = 50
const SEARCH_BUCKET_LIMIT = 40

const buildEmptyCollection = <T>(): DiscoveryCacheCollection<T> => ({
  entities: {},
  buckets: {},
  recent: [],
  frequency: {},
})

const buildEmptyState = (): DiscoveryCacheState => ({
  version: 1,
  accounts: buildEmptyCollection<HiveAccountSearchResult>(),
  communities: buildEmptyCollection<HiveCommunity>(),
})

const getStorage = (storage?: DiscoveryStorageLike) => {
  if (storage) return storage
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/^@/, '')

const normalizeQuery = (value: string) => value.trim().toLowerCase().replace(/^@/, '')

const uniqueStrings = (values: string[]) => {
  const unique = new Set<string>()
  values.map(normalizeKey).filter(Boolean).forEach((value) => unique.add(value))
  return Array.from(unique)
}

const resolveAccountKey = (account: HiveAccountSearchResult) => normalizeKey(account.name)

const resolveCommunityKey = (community: HiveCommunity) =>
  normalizeKey(community.name || community.id)

const resolveEntityKey = <T extends DiscoveryEntityType>(
  type: T,
  value: DiscoveryEntityMap[T]
) => {
  if (type === 'accounts') {
    return resolveAccountKey(value as HiveAccountSearchResult)
  }
  return resolveCommunityKey(value as HiveCommunity)
}

const resolveAliases = <T extends DiscoveryEntityType>(
  type: T,
  value: DiscoveryEntityMap[T]
) => {
  if (type === 'accounts') {
    const account = value as HiveAccountSearchResult
    return uniqueStrings([account.name, account.full_name])
  }

  const community = value as HiveCommunity
  return uniqueStrings([community.name, community.id, community.title ?? ''])
}

const pruneRecent = (recent: DiscoveryRecentEntry[]) => recent.slice(0, RECENT_LIMIT)

const pruneFrequency = (frequency: Record<string, DiscoveryFrequencyEntry>) => {
  const entries = Object.values(frequency)
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count
      return right.lastSelectedAt - left.lastSelectedAt
    })
    .slice(0, FREQUENT_LIMIT)

  return entries.reduce<Record<string, DiscoveryFrequencyEntry>>((accumulator, entry) => {
    accumulator[entry.key] = entry
    return accumulator
  }, {})
}

const pruneBuckets = (buckets: Record<string, CachedSearchBucket>, now: number) => {
  const freshEntries = Object.entries(buckets)
    .filter(([, bucket]) => bucket.expiresAt > now)
    .sort((left, right) => right[1].cachedAt - left[1].cachedAt)
    .slice(0, SEARCH_BUCKET_LIMIT)

  return freshEntries.reduce<Record<string, CachedSearchBucket>>((accumulator, [key, bucket]) => {
    accumulator[key] = bucket
    return accumulator
  }, {})
}

const pruneEntities = <T>(
  entities: Record<string, CachedEntity<T>>,
  now: number
) => {
  return Object.entries(entities).reduce<Record<string, CachedEntity<T>>>(
    (accumulator, [key, entity]) => {
      if (entity.expiresAt > now) {
        accumulator[key] = entity
      }
      return accumulator
    },
    {}
  )
}

const pruneCollection = <T>(
  collection: DiscoveryCacheCollection<T>,
  now: number
): DiscoveryCacheCollection<T> => {
  const entities = pruneEntities(collection.entities, now)
  const entityKeys = new Set(Object.keys(entities))
  const buckets = pruneBuckets(collection.buckets, now)
  const recent = pruneRecent(collection.recent.filter((entry) => entityKeys.has(entry.key)))
  const frequency = pruneFrequency(
    Object.values(collection.frequency).reduce<Record<string, DiscoveryFrequencyEntry>>(
      (accumulator, entry) => {
        if (entityKeys.has(entry.key)) {
          accumulator[entry.key] = entry
        }
        return accumulator
      },
      {}
    )
  )

  return {
    entities,
    buckets,
    recent,
    frequency,
  }
}

const pruneState = (state: DiscoveryCacheState, now = Date.now()): DiscoveryCacheState => ({
  version: 1,
  accounts: pruneCollection(state.accounts, now),
  communities: pruneCollection(state.communities, now),
})

const readState = (storage?: DiscoveryStorageLike) => {
  const target = getStorage(storage)
  if (!target) return buildEmptyState()

  try {
    const raw = target.getItem(STORAGE_KEY)
    if (!raw) return buildEmptyState()
    const parsed = JSON.parse(raw) as DiscoveryCacheState
    if (parsed?.version !== 1) return buildEmptyState()
    return pruneState(parsed)
  } catch {
    return buildEmptyState()
  }
}

const writeState = (state: DiscoveryCacheState, storage?: DiscoveryStorageLike) => {
  const target = getStorage(storage)
  if (!target) return
  target.setItem(STORAGE_KEY, JSON.stringify(pruneState(state)))
}

const updateState = (
  updater: (state: DiscoveryCacheState) => DiscoveryCacheState,
  storage?: DiscoveryStorageLike
) => {
  const nextState = pruneState(updater(readState(storage)))
  writeState(nextState, storage)
  return nextState
}

const getCollection = <T extends DiscoveryEntityType>(
  state: DiscoveryCacheState,
  type: T
) => state[type] as DiscoveryCacheCollection<DiscoveryEntityMap[T]>

const setCollection = <T extends DiscoveryEntityType>(
  state: DiscoveryCacheState,
  type: T,
  collection: DiscoveryCacheCollection<DiscoveryEntityMap[T]>
) => ({
  ...state,
  [type]: collection,
}) as DiscoveryCacheState

const scoreKey = (
  key: string,
  aliases: string[],
  query: string,
  bucketKeys: Set<string>,
  recentIndexByKey: Map<string, number>,
  frequencyByKey: Record<string, DiscoveryFrequencyEntry>
) => {
  const exactMatch = aliases.some((alias) => alias === query)
  const prefixMatch = aliases.some((alias) => alias.startsWith(query))
  const includesMatch = aliases.some((alias) => alias.includes(query))
  const recentIndex = recentIndexByKey.get(key)
  const recentBoost = recentIndex === undefined ? 0 : RECENT_LIMIT - recentIndex
  const frequency = frequencyByKey[key]
  const frequencyBoost = frequency ? frequency.count * 25 : 0
  const bucketBoost = bucketKeys.has(key) ? 500 : 0
  const exactBoost = exactMatch ? 1000 : 0
  const prefixBoost = prefixMatch ? 250 : 0
  const includesBoost = includesMatch ? 75 : 0

  return exactBoost + bucketBoost + prefixBoost + includesBoost + recentBoost + frequencyBoost
}

const rankKeys = <T>(
  collection: DiscoveryCacheCollection<T>,
  query: string,
  limit: number
) => {
  const normalizedQuery = normalizeQuery(query)
  const recentIndexByKey = new Map<string, number>()
  collection.recent.forEach((entry, index) => {
    recentIndexByKey.set(entry.key, index)
  })

  if (!normalizedQuery) {
    const scored = new Map<string, number>()
    collection.recent.forEach((entry, index) => {
      scored.set(entry.key, (scored.get(entry.key) ?? 0) + (RECENT_LIMIT - index) * 10)
    })
    Object.values(collection.frequency).forEach((entry) => {
      scored.set(entry.key, (scored.get(entry.key) ?? 0) + entry.count * 25)
    })

    return Array.from(scored.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, limit)
      .map(([key]) => key)
  }

  const bucket = collection.buckets[normalizedQuery]
  const bucketKeys = new Set(bucket?.keys ?? [])
  const matchingKeys = Object.values(collection.entities)
    .filter((entity) => entity.aliases.some((alias) => alias.includes(normalizedQuery)))
    .map((entity) => entity.key)

  const candidates = new Set<string>([...bucketKeys, ...matchingKeys])
  return Array.from(candidates)
    .map((key) => {
      const entity = collection.entities[key]
      if (!entity) return null
      return {
        key,
        score: scoreKey(
          key,
          entity.aliases,
          normalizedQuery,
          bucketKeys,
          recentIndexByKey,
          collection.frequency
        ),
      }
    })
    .filter((entry): entry is { key: string; score: number } => Boolean(entry))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.key)
}

const upsertEntityCollection = <T extends DiscoveryEntityType>(
  collection: DiscoveryCacheCollection<DiscoveryEntityMap[T]>,
  type: T,
  values: DiscoveryEntityMap[T][],
  now: number
) => {
  const entities = { ...collection.entities }
  const keys: string[] = []

  values.forEach((value) => {
    const key = resolveEntityKey(type, value)
    if (!key) return

    const previous = entities[key]
    const aliases = uniqueStrings([
      ...(previous?.aliases ?? []),
      ...resolveAliases(type, value),
    ])

    entities[key] = {
      key,
      aliases,
      value,
      cachedAt: now,
      expiresAt: now + ENTITY_TTL_MS,
    }

    keys.push(key)
  })

  return {
    collection: {
      ...collection,
      entities,
    },
    keys,
  }
}

export const createDiscoveryCacheStore = (storage?: DiscoveryStorageLike) => {
  const store = {
    getState: () => readState(storage),
    cacheSearchResults<T extends DiscoveryEntityType>(
      type: T,
      query: string,
      values: DiscoveryEntityMap[T][]
    ) {
      const normalizedQuery = normalizeQuery(query)
      const now = Date.now()

      const nextState = updateState((state) => {
        const collection = getCollection(state, type)
        const upserted = upsertEntityCollection(collection, type, values, now)
        const buckets = normalizedQuery
          ? {
              ...upserted.collection.buckets,
              [normalizedQuery]: {
                query: normalizedQuery,
                keys: upserted.keys,
                cachedAt: now,
                expiresAt: now + SEARCH_BUCKET_TTL_MS,
              },
            }
          : upserted.collection.buckets

        return setCollection(state, type, {
          ...upserted.collection,
          buckets,
        })
      }, storage)

      return getCollection(nextState, type)
    },
    cacheEntity<T extends DiscoveryEntityType>(type: T, value: DiscoveryEntityMap[T]) {
      const now = Date.now()
      const nextState = updateState((state) => {
        const collection = getCollection(state, type)
        const upserted = upsertEntityCollection(collection, type, [value], now)
        return setCollection(state, type, upserted.collection)
      }, storage)

      return getCollection(nextState, type)
    },
    recordSelection<T extends DiscoveryEntityType>(type: T, value: DiscoveryEntityMap[T]) {
      const now = Date.now()
      const key = resolveEntityKey(type, value)
      if (!key) return null

      const nextState = updateState((state) => {
        const collection = getCollection(state, type)
        const upserted = upsertEntityCollection(collection, type, [value], now)
        const recent = pruneRecent([
          { key, selectedAt: now },
          ...upserted.collection.recent.filter((entry) => entry.key !== key),
        ])
        const previous = upserted.collection.frequency[key]
        const frequency = pruneFrequency({
          ...upserted.collection.frequency,
          [key]: {
            key,
            count: (previous?.count ?? 0) + 1,
            lastSelectedAt: now,
          },
        })

        return setCollection(state, type, {
          ...upserted.collection,
          recent,
          frequency,
        })
      }, storage)

      return getCollection(nextState, type)
    },
    getSnapshot<T extends DiscoveryEntityType>(
      type: T,
      query: string,
      limit = 20
    ): DiscoverySnapshot<DiscoveryEntityMap[T]> {
      const state = readState(storage)
      const collection = getCollection(state, type)
      const normalizedQuery = normalizeQuery(query)
      const rankedKeys = rankKeys(collection, normalizedQuery, limit)
      const results = rankedKeys
        .map((key) => collection.entities[key]?.value)
        .filter(
          (value): value is DiscoveryEntityMap[T] =>
            value !== undefined
        )

      const bucket = normalizedQuery ? collection.buckets[normalizedQuery] : null
      return {
        query: normalizedQuery,
        results,
        cachedAt: bucket?.cachedAt ?? null,
        isStale: bucket ? bucket.expiresAt <= Date.now() : false,
      }
    },
    clear() {
      const target = getStorage(storage)
      if (!target) return
      target.removeItem(STORAGE_KEY)
    },
  }

  return store
}

export const discoveryCache = createDiscoveryCacheStore()

export {
  ENTITY_TTL_MS,
  FREQUENT_LIMIT,
  RECENT_LIMIT,
  SEARCH_BUCKET_LIMIT,
  SEARCH_BUCKET_TTL_MS,
  STORAGE_KEY,
}
