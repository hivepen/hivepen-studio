export type TitleMeta = {
  raw: string
  cleaned: string
  words: Array<string>
  shortTitle: string
  maxLength: number
}

const DEFAULT_MAX_LENGTH = 32

const stripBrackets = (value: string) =>
  value.replace(/\[[^\]]*]/g, '').replace(/\([^)]*\)/g, '')

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const getSentenceBoundaryIndex = (value: string) => {
  const match = value.match(/[!?]/)
  return match?.index ?? -1
}

const getFirstSeparatorIndex = (value: string) => {
  const match = value.match(/[|/]/)
  return match?.index ?? -1
}

const sliceBeforeFirstMeaningfulSeparator = (value: string) => {
  let remaining = value
  while (remaining.length > 0) {
    const index = getFirstSeparatorIndex(remaining)
    if (index === -1) return remaining
    const segment = remaining.slice(0, index).trim()
    if (segment.length > 0) return segment
    remaining = remaining.slice(index + 1).trim()
  }
  return value
}

const buildShortTitle = (words: Array<string>, maxLength: number) => {
  const result: Array<string> = []
  let length = 0

  for (const word of words) {
    const nextLength = length === 0 ? word.length : length + word.length + 1
    if (nextLength > maxLength) break
    result.push(word)
    length = nextLength
  }

  return result.join(' ')
}

const sliceThroughSentenceBoundary = (value: string, maxLength: number) => {
  const boundaryIndex = getSentenceBoundaryIndex(value)
  if (boundaryIndex === -1 || boundaryIndex >= maxLength) return ''

  return value.slice(0, boundaryIndex + 1).trim()
}

export const getTitleMeta = (
  rawTitle: string,
  maxLength = DEFAULT_MAX_LENGTH,
): TitleMeta => {
  const raw = rawTitle ?? ''
  const cleaned = collapseWhitespace(stripBrackets(raw))
  const trimmed = cleaned.trim()
  const baseTitle = sliceBeforeFirstMeaningfulSeparator(trimmed)
  const words = baseTitle.length ? baseTitle.split(' ') : []
  const shortTitle =
    sliceThroughSentenceBoundary(baseTitle, maxLength) ||
    buildShortTitle(words, maxLength) ||
    baseTitle ||
    cleaned

  return {
    raw,
    cleaned,
    words,
    shortTitle,
    maxLength,
  }
}
