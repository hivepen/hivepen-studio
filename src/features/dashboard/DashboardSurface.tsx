import { Box, Card, HStack, Skeleton, Stack, Stat, Text } from '@chakra-ui/react'
import type { ComponentProps, ReactNode } from 'react'

const SURFACE_RADIUS = '16px'

export function MetricCard({
  label,
  value,
  suffix,
  description,
  palette,
  icon,
  media,
  children,
  isLoading,
}: {
  label: string
  value: string | null
  suffix: string
  description?: string
  palette: string
  icon?: ReactNode
  media?: ReactNode
  children?: ReactNode
  isLoading: boolean
}) {
  return (
    <Card.Root
      variant="outline"
      colorPalette={palette}
      borderRadius={SURFACE_RADIUS}
      overflow="hidden"
      bg="bg.panel"
      borderColor="border.muted"
    >
      <Card.Body p={{ base: 4, md: 4.5 }}>
        <Stat.Root>
          <Stack gap={4}>
            <HStack justify="space-between" align="center">
              <Stack gap={4}>
                <Stat.Label color="fg.muted" fontSize="xs">
                  {label}
                </Stat.Label>
                {isLoading ? (
                  <Skeleton height="32px" width="70%" />
                ) : (
                  <Stat.ValueText fontSize="xl" lineHeight="1.05">
                    {value ?? '—'}
                    {suffix ? (
                      <Stat.ValueUnit color="fg.muted" fontSize="xs">
                        {suffix}
                      </Stat.ValueUnit>
                    ) : null}
                  </Stat.ValueText>
                )}
              </Stack>
              {media ? (
                media
              ) : (
                <Box
                  boxSize="8"
                  borderRadius="9px"
                  bg="colorPalette.subtle"
                  color="colorPalette.fg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {icon}
                </Box>
              )}
            </HStack>

            {description ? (
              <Text fontSize="xs" color="fg.muted" lineClamp={2}>
                {description}
              </Text>
            ) : null}
            {children}
          </Stack>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  )
}

export function ChartPanel({
  title,
  subtitle,
  children,
  gridColumn,
  isLoading,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  gridColumn?: ComponentProps<typeof Card.Root>['gridColumn']
  isLoading: boolean
}) {
  return (
    <Card.Root
      variant="outline"
      borderRadius={SURFACE_RADIUS}
      gridColumn={gridColumn}
      bg="bg.panel"
      overflow="hidden"
    >
      <Card.Body>
        <Stack gap={3}>
          <Stack gap={1}>
            <Text fontWeight="600">{title}</Text>
            {subtitle ? (
              <Text
                fontSize="xs"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="0.16em"
                fontFamily="mono"
              >
                {subtitle}
              </Text>
            ) : null}
          </Stack>
          {isLoading ? (
            <Skeleton height="220px" borderRadius="16px" />
          ) : (
            children
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}

export function SeriesLegend({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: string
}) {
  return (
    <HStack gap={2.5}>
      <Box boxSize="8px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      {value ? (
        <Text fontSize="sm" fontFamily="mono">
          {value}
        </Text>
      ) : null}
    </HStack>
  )
}

export function EmptyStateMessage({ message }: { message: string }) {
  return (
    <Box
      minH="11rem"
      border="1px dashed"
      borderColor="border.muted"
      borderRadius="16px"
      bg="bg.subtle"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={6}
      textAlign="center"
    >
      <Text color="fg.muted">{message}</Text>
    </Box>
  )
}
