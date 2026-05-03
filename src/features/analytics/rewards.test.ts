import { describe, expect, it } from 'vitest'
import { aggregateMonthlyPostRewards } from './rewards'
import type { SearchResult } from '@/lib/hive/search'

describe('aggregateMonthlyPostRewards', () => {
  it('buckets post rewards into the last 12 months', () => {
    const now = new Date('2026-04-28T12:00:00.000Z')
    const posts: Array<SearchResult> = [
      {
        author: 'alice',
        permlink: 'april-post',
        title: 'April',
        created: '2026-04-10T12:00:00.000Z',
        tags: [],
        payout: { pending: '0.000 HBD', total: '4.000 HBD' },
      },
      {
        author: 'alice',
        permlink: 'march-post',
        title: 'March',
        created: '2026-03-15T12:00:00.000Z',
        tags: [],
        payout: { pending: '0.000 HBD', total: '2.500 HBD' },
      },
      {
        author: 'alice',
        permlink: 'too-old-post',
        title: 'Old',
        created: '2025-03-01T12:00:00.000Z',
        tags: [],
        payout: { pending: '0.000 HBD', total: '9.000 HBD' },
      },
    ]

    const result = aggregateMonthlyPostRewards(posts, now)
    const april = result.timeline.find((point) => point.month === '2026-04')
    const march = result.timeline.find((point) => point.month === '2026-03')
    const oldestTracked = result.timeline[0]

    expect(result.timeline).toHaveLength(12)
    expect(april).toMatchObject({ totalAmount: 4, postCount: 1, symbol: 'HBD' })
    expect(march).toMatchObject({
      totalAmount: 2.5,
      postCount: 1,
      symbol: 'HBD',
    })
    expect(oldestTracked.month).toBe('2025-05')
    expect(result.summary).toMatchObject({
      totalRewardAmount: 6.5,
      averageRewardAmount: 3.25,
      trackedPostCount: 2,
      symbol: 'HBD',
    })
  })

  it('ignores posts without parseable reward totals', () => {
    const now = new Date('2026-04-28T12:00:00.000Z')
    const posts: Array<SearchResult> = [
      {
        author: 'alice',
        permlink: 'draft',
        title: 'Draft',
        created: '2026-04-01T12:00:00.000Z',
        tags: [],
      },
    ]

    const result = aggregateMonthlyPostRewards(posts, now)
    expect(result.summary.totalRewardAmount).toBe(0)
    expect(result.summary.trackedPostCount).toBe(0)
    expect(result.summary.symbol).toBe('HBD')
  })
})
