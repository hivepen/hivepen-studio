const SECOND_IN_MS = 1000
const MINUTE_IN_MS = 60 * SECOND_IN_MS
const HOUR_IN_MS = 60 * MINUTE_IN_MS
const DAY_IN_MS = 24 * HOUR_IN_MS
const WEEK_IN_MS = 7 * DAY_IN_MS
const MONTH_IN_MS = 30 * DAY_IN_MS
const YEAR_IN_MS = 365 * DAY_IN_MS

type RelativeTimeUnit =
  | Intl.RelativeTimeFormatUnit
  | 'quarter'

const RELATIVE_TIME_DIVISIONS: Array<{
  max: number
  ms: number
  unit: RelativeTimeUnit
}> = [
  { max: MINUTE_IN_MS, ms: SECOND_IN_MS, unit: 'second' },
  { max: HOUR_IN_MS, ms: MINUTE_IN_MS, unit: 'minute' },
  { max: DAY_IN_MS, ms: HOUR_IN_MS, unit: 'hour' },
  { max: WEEK_IN_MS, ms: DAY_IN_MS, unit: 'day' },
  { max: MONTH_IN_MS, ms: WEEK_IN_MS, unit: 'week' },
  { max: YEAR_IN_MS, ms: MONTH_IN_MS, unit: 'month' },
  { max: Number.POSITIVE_INFINITY, ms: YEAR_IN_MS, unit: 'year' },
]

export function formatRelativeTime(
  value: string | Date,
  locale: string,
  now = new Date(),
) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  })
  const elapsed = date.getTime() - now.getTime()
  const absoluteElapsed = Math.abs(elapsed)
  const division =
    RELATIVE_TIME_DIVISIONS.find(({ max }) => absoluteElapsed < max) ??
    RELATIVE_TIME_DIVISIONS[RELATIVE_TIME_DIVISIONS.length - 1]
  const rounded = Math.round(elapsed / division.ms)

  return formatter.format(rounded, division.unit)
}

export function formatFullDateTime(value: string | Date, locale: string) {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
