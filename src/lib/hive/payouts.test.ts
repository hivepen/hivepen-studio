import { describe, expect, it } from 'vitest'
import { formatAssetAmount, parseAssetAmount, sumAssetStrings } from './payouts'

describe('payout parsing helpers', () => {
  it('parses asset amounts', () => {
    expect(parseAssetAmount('1.234 HBD')).toEqual({ amount: 1.234, symbol: 'HBD' })
  })

  it('returns null for invalid input', () => {
    expect(parseAssetAmount('')).toBeNull()
    expect(parseAssetAmount('invalid')).toBeNull()
  })

  it('formats asset amounts consistently', () => {
    expect(formatAssetAmount({ amount: 2, symbol: 'HIVE' })).toBe('2.000 HIVE')
  })

  it('sums matching asset strings', () => {
    expect(sumAssetStrings('1.100 HBD', '2.200 HBD')).toBe('3.300 HBD')
  })

  it('returns null for mismatched assets', () => {
    expect(sumAssetStrings('1.000 HBD', '2.000 HIVE')).toBeNull()
  })
})
