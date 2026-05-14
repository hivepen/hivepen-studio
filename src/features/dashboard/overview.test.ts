import { describe, expect, it } from 'vitest'
import {
  aggregateDashboardOverview,
  buildBuckets,
  selectHistoricalChartKind,
} from './overview'
import type { PostSearchResult } from '@/lib/hive/search'

describe('dashboard bucket generation', () => {
  it('builds weekly buckets for 1M and monthly buckets for 1Y', () => {
    const now = new Date('2026-05-13T12:00:00.000Z')
    const oneMonth = buildBuckets('1M', now)
    const oneYear = buildBuckets('1Y', now)

    expect(oneMonth).toHaveLength(4)
    expect(oneYear).toHaveLength(12)
    expect(
      new Date(oneMonth[0].endAt).getTime() -
        new Date(oneMonth[0].startAt).getTime(),
    ).toBe(7 * 24 * 60 * 60 * 1000)
    expect(oneYear[0].longLabel).toContain('2025')
    expect(oneYear[oneYear.length - 1].shortLabel).toBe('May')
  })
})

describe('aggregateDashboardOverview', () => {
  it('aggregates current and previous reward windows into dashboard metrics', () => {
    const now = new Date('2026-05-13T12:00:00.000Z')
    const posts: Array<PostSearchResult> = [
      {
        author: 'alice',
        permlink: 'current-top',
        title: 'Current top',
        created: '2026-04-10T12:00:00.000Z',
        tags: ['dev'],
        coverUrl: 'https://images.hive.blog/current-top.jpg',
        payout: { pending: '0.000 HBD', total: '6.000 HBD' },
        authorPayout: '4.000 HBD',
        curatorPayout: '2.000 HBD',
        votes: 5,
        comments: 2,
        images: [],
      },
      {
        author: 'alice',
        permlink: 'current-second',
        title: 'Current second',
        created: '2026-05-01T12:00:00.000Z',
        tags: ['news'],
        coverUrl: 'https://images.hive.blog/current-second.jpg',
        payout: { pending: '0.000 HBD', total: '3.000 HBD' },
        authorPayout: '2.000 HBD',
        curatorPayout: '1.000 HBD',
        votes: 1,
        comments: 0,
        images: [],
      },
      {
        author: 'alice',
        permlink: 'previous-period',
        title: 'Previous period',
        created: '2026-01-10T12:00:00.000Z',
        tags: ['old'],
        payout: { pending: '0.000 HBD', total: '2.000 HBD' },
        authorPayout: '1.000 HBD',
        curatorPayout: '1.000 HBD',
        votes: 3,
        comments: 1,
        images: [],
      },
    ]

    const result = aggregateDashboardOverview({
      posts,
      range: '3M',
      rewardHistory: [
        {
          type: 'curation_reward',
          timestamp: '2026-04-12T00:00:00.000Z',
          reward: '2.000000 VESTS',
        },
        {
          type: 'interest',
          timestamp: '2026-05-02T00:00:00.000Z',
          interest: '0.500 HBD',
        },
        {
          type: 'curation_reward',
          timestamp: '2026-01-12T00:00:00.000Z',
          reward: '2.000000 VESTS',
        },
        {
          type: 'interest',
          timestamp: '2026-01-15T00:00:00.000Z',
          interest: '0.500 HBD',
        },
      ],
      properties: {
        total_vesting_fund_hive: '1000.000 HIVE',
        total_vesting_shares: '1000.000000 VESTS',
      },
      hivePriceHbd: 0.5,
      now,
    })

    expect(result.buckets).toHaveLength(12)
    expect(result.summary).toMatchObject({
      totalRewards: 7.5,
      averagePostReward: 4.5,
      publishedPosts: 2,
    })
    expect(result.summary.totalRewardsChange).toBe(2)
    expect(result.summary.averagePostRewardChange).toBe(1.25)
    expect(result.breakdown.map((item) => item.value)).toEqual([6, 1, 0.5])
    expect(result.topPosts.map((post) => post.permlink)).toEqual([
      'current-top',
      'current-second',
    ])
    expect(result.topPosts.map((post) => post.coverUrl)).toEqual([
      'https://images.hive.blog/current-top.jpg',
      'https://images.hive.blog/current-second.jpg',
    ])
    expect(
      result.buckets.reduce((total, bucket) => total + bucket.votes, 0),
    ).toBe(6)
    expect(
      result.buckets.reduce((total, bucket) => total + bucket.comments, 0),
    ).toBe(2)
  })
})

describe('selectHistoricalChartKind', () => {
  it('uses bars for sparse weekly series and lines for denser series', () => {
    const sparse = buildBuckets('1M', new Date('2026-05-13T12:00:00.000Z'))
    sparse[0].totalRewards = 1
    sparse[1].totalRewards = 2

    const dense = buildBuckets('1Y', new Date('2026-05-13T12:00:00.000Z'))
    dense[0].votes = 1
    dense[1].votes = 1
    dense[2].votes = 1
    dense[3].votes = 1

    expect(selectHistoricalChartKind(sparse, 'totalRewards', 'week')).toBe(
      'bar',
    )
    expect(selectHistoricalChartKind(dense, 'votes', 'month')).toBe('line')
  })
})
