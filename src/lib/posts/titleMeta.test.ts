import { describe, expect, it } from 'vitest'
import { getTitleMeta } from './titleMeta'

describe('getTitleMeta', () => {
  it('keeps a leading question title up to the first question mark', () => {
    expect(
      getTitleMeta('Why does Hive matter? A practical intro for newcomers', 40)
        .shortTitle,
    ).toBe('Why does Hive matter?')
  })

  it('keeps a leading exclamation title up to the first exclamation mark', () => {
    expect(
      getTitleMeta('Breaking news! Hive just changed everything for writers', 40)
        .shortTitle,
    ).toBe('Breaking news!')
  })
})
