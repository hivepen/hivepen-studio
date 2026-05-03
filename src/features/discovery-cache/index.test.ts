import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEARCH_BUCKET_LIMIT, createDiscoveryCacheStore } from './index'
import type { DiscoveryStorageLike } from './types'

const createMemoryStorage = (): DiscoveryStorageLike => {
  const memory = new Map<string, string>()
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value)
    },
    removeItem: (key) => {
      memory.delete(key)
    },
  }
}

describe('discovery cache store', () => {
  const baseTime = new Date('2026-04-28T12:00:00.000Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(baseTime)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('expires stale entities and buckets', () => {
    const store = createDiscoveryCacheStore(createMemoryStorage())
    store.cacheSearchResults('accounts', 'alice', [
      { name: 'alice', full_name: 'Alice', about: 'Writer', reputation: 42 },
    ])

    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000)

    const snapshot = store.getSnapshot('accounts', 'alice')
    expect(snapshot.results).toEqual([])
    expect(store.getState().accounts.entities).toEqual({})
  })

  it('evicts old search buckets beyond the limit', () => {
    const store = createDiscoveryCacheStore(createMemoryStorage())

    for (let index = 0; index < SEARCH_BUCKET_LIMIT + 5; index += 1) {
      store.cacheSearchResults('accounts', `query-${index}`, [
        {
          name: `user-${index}`,
          full_name: `User ${index}`,
          about: '',
          reputation: index,
        },
      ])
      vi.advanceTimersByTime(1000)
    }

    const state = store.getState()
    expect(Object.keys(state.accounts.buckets)).toHaveLength(
      SEARCH_BUCKET_LIMIT,
    )
    expect(state.accounts.buckets['query-0']).toBeUndefined()
    expect(
      state.accounts.buckets[`query-${SEARCH_BUCKET_LIMIT + 4}`],
    ).toBeDefined()
  })

  it('ranks frequent entities ahead of less-used matches', () => {
    const store = createDiscoveryCacheStore(createMemoryStorage())
    const alice = {
      name: 'alice',
      full_name: 'Alice',
      about: '',
      reputation: 10,
    }
    const alina = {
      name: 'alina',
      full_name: 'Alina',
      about: '',
      reputation: 12,
    }

    store.cacheSearchResults('accounts', 'ali', [alice, alina])
    store.recordSelection('accounts', alina)
    store.recordSelection('accounts', alina)
    store.recordSelection('accounts', alice)

    const snapshot = store.getSnapshot('accounts', 'ali')
    expect(snapshot.results.map((entry) => entry.name)).toEqual([
      'alina',
      'alice',
    ])
  })

  it('merges recents and frequents for empty-query suggestions', () => {
    const store = createDiscoveryCacheStore(createMemoryStorage())
    const alpha = {
      name: 'alpha',
      full_name: 'Alpha',
      about: '',
      reputation: 10,
    }
    const beta = { name: 'beta', full_name: 'Beta', about: '', reputation: 11 }
    const gamma = {
      name: 'gamma',
      full_name: 'Gamma',
      about: '',
      reputation: 12,
    }

    store.cacheEntity('accounts', alpha)
    store.cacheEntity('accounts', beta)
    store.cacheEntity('accounts', gamma)

    store.recordSelection('accounts', alpha)
    store.recordSelection('accounts', alpha)
    store.recordSelection('accounts', beta)
    vi.advanceTimersByTime(1000)
    store.recordSelection('accounts', gamma)

    const snapshot = store.getSnapshot('accounts', '', 3)
    expect(snapshot.results.map((entry) => entry.name)).toEqual([
      'alpha',
      'gamma',
      'beta',
    ])
  })

  it('handles numeric community ids without crashing', () => {
    const store = createDiscoveryCacheStore(createMemoryStorage())
    const community = {
      id: 1337,
      name: '',
      title: 'Numeric Community',
      about: 'Test community',
    }

    expect(() =>
      store.cacheSearchResults('communities', 'numeric', [community]),
    ).not.toThrow()

    const snapshot = store.getSnapshot('communities', '1337')
    expect(snapshot.results).toEqual([community])
  })
})
