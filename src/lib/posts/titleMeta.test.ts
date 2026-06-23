import { describe, expect, it } from 'vitest'
import {
  extractPreferredTitleSegment,
  getTitlePresentation,
  normalizeTitle,
  shortenTitle,
} from './titleMeta'

describe('titleMeta', () => {
  it('keeps a leading question title up to the first question mark', () => {
    expect(
      getTitlePresentation(
        'Why does Hive matter? A practical intro for newcomers',
        { maxLength: 40 },
      ).shortTitle,
    ).toBe('Why does Hive matter?')
  })

  it('keeps a leading exclamation title up to the first exclamation mark', () => {
    expect(
      getTitlePresentation(
        'Breaking news! Hive just changed everything for writers',
        { maxLength: 40 },
      ).shortTitle,
    ).toBe('Breaking news!')
  })

  it('drops leading metadata tags but preserves the main title', () => {
    expect(normalizeTitle('[ENG] My first post')).toBe('My first post')
  })

  it('preserves meaningful parentheticals', () => {
    const presentation = getTitlePresentation('Release Notes (v2.3)', {
      maxLength: 32,
    })

    expect(presentation.displayTitle).toBe('Release Notes (v2.3)')
    expect(presentation.shortTitle).toBe('Release Notes (v2.3)')
  })

  it('prefers the more informative segment when the prefix is generic', () => {
    expect(
      extractPreferredTitleSegment('Weekly Report: Hive Growth Update'),
    ).toBe('Hive Growth Update')
  })

  it('keeps the primary segment in pipe-delimited titles', () => {
    expect(
      extractPreferredTitleSegment('Hive recap | June 2026 | by Alice'),
    ).toBe('Hive recap')
  })

  it('does not discard the meaningful segment when the prefix is generic', () => {
    expect(
      extractPreferredTitleSegment('Part 2 / Hive onboarding'),
    ).toBe('Hive onboarding')
  })

  it('truncates long single-token titles gracefully', () => {
    expect(shortenTitle('SupercalifragilisticexpialidociousPost', { maxLength: 20 })).toBe(
      'Supercalifragilis...',
    )
  })

  it('uses the shared untitled fallback for blank titles', () => {
    expect(
      getTitlePresentation('   ', { untitledFallback: 'Untitled post' }),
    ).toMatchObject({
      displayTitle: 'Untitled post',
      shortTitle: 'Untitled post',
    })
  })
})
