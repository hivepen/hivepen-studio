import {
  Box,
  Flex,
  Slider,
  Text,
} from '@chakra-ui/react'

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

type WeightSliderProps = {
  value: number | string
  onChange: (nextValue: number) => void
  label?: string
  helperText?: string
}

export default function WeightSlider({
  value,
  onChange,
  label = 'Weight',
  helperText = 'Applies a percentage of rewards.',
}: WeightSliderProps) {
  const parsed = typeof value === 'string' ? Number(value) : value
  const safeValue = Number.isFinite(parsed) ? parsed : 0
  const percentValue = clamp(Math.round(safeValue / 100), 0, 100)

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" color="fg.muted">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="600">
          {percentValue}%
        </Text>
      </Flex>
      <Slider.Root
        value={[percentValue]}
        min={0}
        max={100}
        step={1}
        onValueChange={(details) => onChange(details.value[0] * 100)}
      >
        <Slider.Control>
          <Slider.Track bg="bg.subtle">
            <Slider.Range bg="fg" />
          </Slider.Track>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>
      <Text fontSize="xs" color="fg.muted" mt={2}>
        {helperText}
      </Text>
    </Box>
  )
}
