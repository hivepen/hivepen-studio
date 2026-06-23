export type TitlePresentation = {
  raw: string
  normalized: string
  displayTitle: string
  shortTitle: string
  altTitle: string
}

export type TitlePresentationOptions = {
  maxLength?: number
  untitledFallback?: string
  ellipsis?: string
}

const DEFAULT_MAX_LENGTH = 32
const DEFAULT_ELLIPSIS = '...'

const LEADING_TRAILING_QUOTES = /^[`"'“”‘’]+|[`"'“”‘’]+$/g
const LEADING_TRAILING_DECORATION = /^[|/\\\-–—•:;,.!?]+|[|/\\\-–—•:;,.!?]+$/g
const LEADING_METADATA_PATTERN =
  /^(?:\[(?<square>[^\]]*)\]|\((?<round>[^)]*)\))\s*/i
const METADATA_NOISE_PATTERNS = [
  /^(?:oc|nsfw|eng|esp|es|en|fr|de|pt|it|ru|ua|pl|kr|jp|cn)$/i,
  /^(?:video|audio|podcast|clip|reel|shorts?)$/i,
]
const GENERIC_PREFIX_PATTERNS = [
  /^(?:weekly|daily|monthly|yearly)\s+(?:report|update|recap|digest)$/i,
  /^(?:report|update|recap|digest)$/i,
  /^(?:episode|ep|part|day|week|month|issue|chapter)\s+#?\d+$/i,
]
const LOW_SIGNAL_SEGMENT_PATTERNS = [
  /^(?:by|from)\s+\S+/i,
  /^(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}$/i,
  /^(?:jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{4}$/i,
  /^(?:\d{4}|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)$/i,
]

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const trimDecorativeWrappers = (value: string) =>
  value
    .replace(LEADING_TRAILING_QUOTES, '')
    .replace(LEADING_TRAILING_DECORATION, '')
    .trim()

const isMetadataNoise = (value: string) => {
  const normalized = collapseWhitespace(value).replace(/[.]+$/g, '').trim()
  if (!normalized) return true

  return METADATA_NOISE_PATTERNS.some((pattern) => pattern.test(normalized))
}

const stripLeadingNoiseTags = (value: string) => {
  let current = value

  while (current.length > 0) {
    const match = current.match(LEADING_METADATA_PATTERN)
    const candidate = match?.groups?.square ?? match?.groups?.round ?? ''
    if (!match || !isMetadataNoise(candidate)) break
    current = current.slice(match[0].length).trim()
  }

  return current
}

const normalizeRepeatedPunctuation = (value: string) =>
  value
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    .replace(/\.{4,}/g, '...')

export const normalizeTitle = (
  rawTitle: string,
  untitledFallback = '',
): string => {
  const raw = typeof rawTitle === 'string' ? rawTitle : ''
  const withFallback = raw.trim() ? raw : untitledFallback
  const collapsed = collapseWhitespace(withFallback)
  const stripped = stripLeadingNoiseTags(collapsed)
  const normalized = normalizeRepeatedPunctuation(trimDecorativeWrappers(stripped))

  return normalized || untitledFallback.trim()
}

const TITLE_SEGMENT_SEPARATOR =
  /\s(?:\||•|\/|-|–|—)\s|\s*:\s+/g

const getMeaningfulWordCount = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean).length

const scoreSegment = (segment: string, index: number) => {
  const normalized = collapseWhitespace(trimDecorativeWrappers(segment))
  if (!normalized) return Number.NEGATIVE_INFINITY

  let score = getMeaningfulWordCount(normalized) * 4

  if (normalized.length >= 12) score += 2
  if (/[?!]/.test(normalized)) score += 2
  if (/[A-Za-z]/.test(normalized) && /\d/.test(normalized)) score += 1
  if (index === 0) score += 1

  if (GENERIC_PREFIX_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 6
  }

  if (LOW_SIGNAL_SEGMENT_PATTERNS.some((pattern) => pattern.test(normalized))) {
    score -= 5
  }

  return score
}

export const extractPreferredTitleSegment = (normalizedTitle: string): string => {
  const normalized = collapseWhitespace(normalizedTitle)
  if (!normalized) return ''

  const segments = normalized
    .split(TITLE_SEGMENT_SEPARATOR)
    .map((segment) => collapseWhitespace(trimDecorativeWrappers(segment)))
    .filter(Boolean)

  if (segments.length <= 1) return normalized

  let bestSegment = segments[0]
  let bestScore = scoreSegment(segments[0], 0)

  for (const [index, segment] of segments.entries()) {
    const score = scoreSegment(segment, index)
    if (score > bestScore) {
      bestSegment = segment
      bestScore = score
    }
  }

  return bestSegment
}

const findPreferredBoundary = (value: string, maxLength: number) => {
  const boundaries = Array.from(value.matchAll(/[!?]|\.{3}|[.:;]/g))
    .map((match) => match.index)
    .filter((index) => index >= 0 && index < maxLength)

  return boundaries.length > 0 ? boundaries[boundaries.length - 1] : -1
}

const truncateWithEllipsis = (
  value: string,
  maxLength: number,
  ellipsis: string,
) => {
  if (value.length <= maxLength) return value
  if (maxLength <= ellipsis.length) return value.slice(0, maxLength)

  return `${value.slice(0, maxLength - ellipsis.length).trimEnd()}${ellipsis}`
}

export const shortenTitle = (
  segment: string,
  {
    maxLength = DEFAULT_MAX_LENGTH,
    ellipsis = DEFAULT_ELLIPSIS,
  }: Pick<TitlePresentationOptions, 'maxLength' | 'ellipsis'> = {},
): string => {
  const normalized = collapseWhitespace(segment)
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized

  const boundaryIndex = findPreferredBoundary(normalized, maxLength)
  if (boundaryIndex >= 0) {
    return normalized.slice(0, boundaryIndex + 1).trim()
  }

  const words = normalized.split(' ')
  const result: Array<string> = []
  let length = 0

  for (const word of words) {
    const nextLength = length === 0 ? word.length : length + word.length + 1
    if (nextLength > maxLength) break
    result.push(word)
    length = nextLength
  }

  if (result.length > 0) {
    return result.join(' ')
  }

  return truncateWithEllipsis(normalized, maxLength, ellipsis)
}

export const getTitlePresentation = (
  rawTitle: string,
  {
    maxLength = DEFAULT_MAX_LENGTH,
    untitledFallback = '',
    ellipsis = DEFAULT_ELLIPSIS,
  }: TitlePresentationOptions = {},
): TitlePresentation => {
  const raw = typeof rawTitle === 'string' ? rawTitle : ''
  const normalized = normalizeTitle(raw, untitledFallback)
  const displayTitle = extractPreferredTitleSegment(normalized) || normalized
  const shortTitle =
    shortenTitle(displayTitle, { maxLength, ellipsis }) ||
    shortenTitle(normalized, { maxLength, ellipsis }) ||
    untitledFallback.trim()

  return {
    raw,
    normalized,
    displayTitle,
    shortTitle,
    altTitle: shortTitle,
  }
}
