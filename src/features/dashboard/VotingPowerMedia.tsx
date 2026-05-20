import { Box, Text } from '@chakra-ui/react'

const SIZE = 52
const STROKE_WIDTH = 5
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function VotingPowerMedia({
  value,
}: {
  value: number | null | undefined
}) {
  const safeValue =
    value != null && Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : null
  const dashOffset =
    safeValue == null
      ? CIRCUMFERENCE
      : CIRCUMFERENCE - (safeValue / 100) * CIRCUMFERENCE

  return (
    <Box position="relative" boxSize="52px" flexShrink={0}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        height="100%"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--chakra-colors-color-palette-subtle)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--chakra-colors-color-palette-solid)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <Text
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="xs"
        fontWeight="700"
        color={safeValue == null ? 'fg.muted' : 'colorPalette.fg'}
        fontVariantNumeric="tabular-nums"
      >
        {safeValue == null ? '—' : `${Math.round(safeValue)}%`}
      </Text>
    </Box>
  )
}
