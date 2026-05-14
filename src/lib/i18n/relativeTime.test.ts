import { describe, expect, it } from 'vitest'
import { formatFullDateTime, formatRelativeTime } from './relativeTime'

describe('formatRelativeTime', () => {
  const now = new Date('2026-05-13T12:00:00.000Z')

  it('formats past dates in English', () => {
    expect(formatRelativeTime('2026-05-13T11:57:00.000Z', 'en', now)).toBe(
      '3 minutes ago',
    )
  })

  it('formats past dates in Spanish', () => {
    expect(formatRelativeTime('2026-05-13T11:00:00.000Z', 'es', now)).toBe(
      'hace 1 hora',
    )
  })

  it('falls back to an empty string for invalid dates', () => {
    expect(formatRelativeTime('not-a-date', 'en', now)).toBe('')
    expect(formatFullDateTime('not-a-date', 'en')).toBe('')
  })
})
