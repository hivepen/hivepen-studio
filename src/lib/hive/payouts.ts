export type AssetAmount = {
  amount: number
  symbol: string
}

const ASSET_AMOUNT_PATTERN = /^(-?\d+(?:\.\d+)?)\s+([A-Z]+)$/

export const parseAssetAmount = (value: string): AssetAmount | null => {
  if (!value) return null
  const match = value.trim().match(ASSET_AMOUNT_PATTERN)
  if (!match) return null
  const amount = Number(match[1])
  if (!Number.isFinite(amount)) return null
  return { amount, symbol: match[2] }
}

export const formatAssetAmount = ({ amount, symbol }: AssetAmount) =>
  `${amount.toFixed(3)} ${symbol}`

export const sumAssetStrings = (left: string, right: string) => {
  const leftParsed = parseAssetAmount(left)
  const rightParsed = parseAssetAmount(right)
  if (!leftParsed || !rightParsed) return null
  if (leftParsed.symbol !== rightParsed.symbol) return null
  return formatAssetAmount({
    amount: leftParsed.amount + rightParsed.amount,
    symbol: leftParsed.symbol,
  })
}
