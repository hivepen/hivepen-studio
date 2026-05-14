import { describe, expect, it } from 'vitest'
import { mapSearchResultToPostCardProps, resolvePostCommunity } from './postCardMapping'

describe('resolvePostCommunity', () => {
  it('prefers the explicit community title for the label', () => {
    expect(
      resolvePostCommunity({
        communityId: 'hive-123',
        communityTitle: 'Hive Developers',
        communityInfo: { id: 'hive-123', name: 'Developers' },
      }),
    ).toEqual({
      id: 'hive-123',
      label: 'Hive Developers',
    })
  })

  it('falls back to the id when no display name exists', () => {
    expect(
      resolvePostCommunity({
        communityId: 'hive-456',
      }),
    ).toEqual({
      id: 'hive-456',
      label: 'hive-456',
    })
  })
})

describe('mapSearchResultToPostCardProps', () => {
  it('preserves the raw created timestamp for relative-time rendering', () => {
    const post = mapSearchResultToPostCardProps({
      author: 'alice',
      created: '2026-05-13T12:00:00.000Z',
      images: [],
      permlink: 'hello-world',
      tags: [],
      title: 'Hello world',
      communityId: 'hive-123',
      communityTitle: 'Hive Developers',
    })

    expect(post.createdAt).toBe('2026-05-13T12:00:00.000Z')
    expect(post.community).toEqual({
      id: 'hive-123',
      label: 'Hive Developers',
    })
  })
})
