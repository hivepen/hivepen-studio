import {
  Box,
  Flex,
  HStack,
  Image,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { PieSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type { ComposeOption, EChartsType } from 'echarts/core'
import { DASHBOARD_DELEGATION_SLICE_TOKENS } from './chartPalette'
import type { DashboardDelegation } from './types'

echarts.use([PieChart, TooltipComponent, SVGRenderer])

type DelegationDonutChartOption = ComposeOption<
  PieSeriesOption | TooltipComponentOption
>

type HpDelegationDonutChartProps = {
  account: string
  delegations: Array<DashboardDelegation>
  ownHivePower: number
}

type DelegationSlice = DashboardDelegation & {
  label: string
  colorToken: (typeof DASHBOARD_DELEGATION_SLICE_TOKENS)[number]
}

const CHART_SIZE = 320
const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`
const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

function resolveCssVar(varExpr: string, element: HTMLElement): string {
  const match = varExpr.match(/var\((--[^)]+)\)/)
  if (!match) return varExpr
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || '#888888'
}

function formatCompactAmount(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value)
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0.0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

function DelegationLegendRow({
  delegation,
  totalDelegated,
  isActive,
  isPinned,
  onPreview,
  onPreviewEnd,
  onTogglePin,
}: {
  delegation: DelegationSlice
  totalDelegated: number
  isActive: boolean
  isPinned: boolean
  onPreview: () => void
  onPreviewEnd: () => void
  onTogglePin: () => void
}) {
  const palette = delegation.colorToken.split('.')[0] ?? 'gray'

  return (
    <Box
      as="button"
      w="full"
      colorPalette={palette}
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      onClick={onTogglePin}
      aria-pressed={isPinned}
      aria-label={`@${delegation.delegatee}, ${formatPercent(
        delegation.hivePower,
        totalDelegated,
      )} of delegated HP, ${formatCompactAmount(delegation.hivePower)} HP`}
      textAlign="left"
      px={1.5}
      py={1.25}
      borderRadius="md"
      borderWidth="1px"
      borderColor={isActive ? 'colorPalette.border' : 'transparent'}
      bg={isActive ? 'colorPalette.subtle' : 'transparent'}
      opacity={isActive ? 1 : 0.72}
      transition="background 0.14s, opacity 0.14s, border-color 0.14s"
      _hover={{ opacity: 1 }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'colorPalette.focusRing',
        outlineOffset: '2px',
      }}
    >
      <HStack gap={2.5}>
        <Image
          src={`https://images.hive.blog/u/${delegation.delegatee}/avatar/small`}
          alt={delegation.delegatee}
          boxSize="20px"
          borderRadius="full"
          border="1.5px solid"
          borderColor={delegation.colorToken}
          objectFit="cover"
          filter="grayscale(20%) brightness(0.92)"
          flexShrink={0}
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <Text
          flex="1"
          minW={0}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          fontSize="13px"
          color={isActive ? 'colorPalette.fg' : 'fg'}
          fontWeight="500"
          fontFamily="mono"
        >
          @{delegation.delegatee}
        </Text>
        <Text fontSize="11px" color="fg.muted" fontFamily="mono" flexShrink={0}>
          {formatPercent(delegation.hivePower, totalDelegated)}
        </Text>
        <Text
          minW="62px"
          textAlign="right"
          fontSize="12px"
          color={isActive ? 'colorPalette.fg' : 'fg.subtle'}
          fontFamily="mono"
          fontWeight={isActive ? '600' : '400'}
          flexShrink={0}
        >
          {formatCompactAmount(delegation.hivePower)} HP
        </Text>
      </HStack>
    </Box>
  )
}

export default function HpDelegationDonutChart({
  account,
  delegations,
  ownHivePower,
}: HpDelegationDonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)
  const [hoveredDelegatee, setHoveredDelegatee] = useState<string | null>(null)
  const [pinnedDelegatee, setPinnedDelegatee] = useState<string | null>(null)
  const chartInstructionId = 'delegation-donut-chart-instructions'
  const chartSummaryId = 'delegation-donut-chart-summary'
  const chartTitleId = 'delegation-donut-chart-body-title'

  const slices = useMemo<Array<DelegationSlice>>(
    () =>
      delegations.map((delegation, index) => ({
        ...delegation,
        label: `@${delegation.delegatee}`,
        colorToken:
          DASHBOARD_DELEGATION_SLICE_TOKENS[
            index % DASHBOARD_DELEGATION_SLICE_TOKENS.length
          ],
      })),
    [delegations],
  )

  const totalDelegated = useMemo(
    () => slices.reduce((sum, delegation) => sum + delegation.hivePower, 0),
    [slices],
  )
  const hasPinnedSelection = pinnedDelegatee != null
  const activeDelegatee = pinnedDelegatee ?? hoveredDelegatee
  const activeSlice =
    slices.find((delegation) => delegation.delegatee === activeDelegatee) ?? null

  const clearPreview = useCallback(() => {
    if (hasPinnedSelection) return
    setHoveredDelegatee(null)
  }, [hasPinnedSelection])

  const previewDelegatee = useCallback(
    (delegatee: string) => {
      if (hasPinnedSelection) return
      setHoveredDelegatee(delegatee)
    },
    [hasPinnedSelection],
  )

  const clearPinnedSelection = useCallback(() => {
    setPinnedDelegatee(null)
  }, [])

  const togglePinnedDelegatee = useCallback(
    (delegatee: string) => {
      if (pinnedDelegatee === delegatee) {
        clearPinnedSelection()
        return
      }

      setPinnedDelegatee(delegatee)
      setHoveredDelegatee(null)
    },
    [clearPinnedSelection, pinnedDelegatee],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || slices.length === 0) return
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('jsdom')
    ) {
      return
    }

    const instance = echarts.init(container, undefined, { renderer: 'svg' })
    instanceRef.current = instance

    const observer =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => instance.resize())
        : null

    observer?.observe(container)

    return () => {
      observer?.disconnect()
      instance.dispose()
      instanceRef.current = null
    }
  }, [slices.length])

  useEffect(() => {
    const instance = instanceRef.current
    if (!instance) return

    const handleMouseover = (params: unknown) => {
      const payload = params as { name?: string }
      const delegatee = String(payload.name ?? '').replace(/^@/, '')
      if (delegatee) previewDelegatee(delegatee)
    }

    const handleGlobalOut = () => clearPreview()

    const handleClick = (params: unknown) => {
      const payload = params as { name?: string }
      const delegatee = String(payload.name ?? '').replace(/^@/, '')
      if (delegatee) togglePinnedDelegatee(delegatee)
    }

    instance.on('mouseover', handleMouseover)
    instance.on('globalout', handleGlobalOut)
    instance.on('click', handleClick)

    return () => {
      instance.off('mouseover', handleMouseover)
      instance.off('globalout', handleGlobalOut)
      instance.off('click', handleClick)
    }
  }, [clearPreview, previewDelegatee, togglePinnedDelegatee])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || slices.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const nothingActive = activeDelegatee == null

    const option: DelegationDonutChartOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: color(semanticVar('bg.panel')),
        borderColor: color(semanticVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
          fontSize: 11,
        },
        formatter: (params) => {
          if (Array.isArray(params)) return ''
          const delegatee = String(params.name ?? '').replace(/^@/, '')
          const slice = slices.find((entry) => entry.delegatee === delegatee)
          if (!slice) return ''

          return [
            `<div style="font-weight:600;margin-bottom:6px;">@${slice.delegatee}</div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Delegated</span><span>${formatCompactAmount(
              slice.hivePower,
            )} HP</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Share of delegated</span><span>${formatPercent(
              slice.hivePower,
              totalDelegated,
            )}</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Share of owned HP</span><span>${formatPercent(
              slice.hivePower,
              ownHivePower,
            )}</span></div>`,
          ].join('')
        },
      },
      series: [
        {
          name: 'Outgoing HP delegations',
          type: 'pie',
          radius: ['42%', '72%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          padAngle: 4,
          minAngle: 3,
          selectedMode: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: color(semanticVar('bg.panel')),
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: false,
            label: {
              show: false,
            },
          },
          labelLine: {
            show: false,
          },
          data: slices.map((delegation) => {
            const isActive = activeDelegatee === delegation.delegatee

            return {
              value: Number(delegation.hivePower.toFixed(3)),
              name: delegation.label,
              itemStyle: {
                color: color(tokenVar(delegation.colorToken)),
                opacity: nothingActive ? 0.94 : isActive ? 1 : 0.24,
                borderColor: isActive
                  ? color(semanticVar(`${delegation.colorToken.split('.')[0]}.border`))
                  : color(semanticVar('bg.panel')),
                borderWidth: isActive ? 3 : 2,
              },
            }
          }),
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [activeDelegatee, ownHivePower, slices, totalDelegated])

  if (slices.length === 0) {
    return null
  }

  const centerAvatarAccount = activeSlice?.delegatee ?? account
  const centerRingColor = activeSlice?.colorToken ?? 'teal.solid'

  return (
    <Stack
      gap={5}
      role="group"
      aria-labelledby={chartTitleId}
      aria-describedby={`${chartInstructionId} ${chartSummaryId}`}
    >
      <VisuallyHidden id={chartTitleId}>Outgoing HP delegations chart</VisuallyHidden>
      <VisuallyHidden id={chartInstructionId}>
        Hover or focus rows to preview delegations. Click a row or chart slice to
        pin it, then use the clear pin action to reset the chart.
      </VisuallyHidden>
      <VisuallyHidden id={chartSummaryId}>
        {`${formatCompactAmount(totalDelegated)} HP delegated across ${slices.length} delegatees.`}
      </VisuallyHidden>

      <Flex justify="flex-end" align={{ base: 'start', sm: 'center' }} gap={3} wrap="wrap">
        <HStack gap={2} wrap="wrap" justify="end">
          {hasPinnedSelection ? (
            <Box
              as="button"
              onClick={clearPinnedSelection}
              px={2.5}
              py={1}
              borderRadius="md"
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.subtle"
              fontSize="11px"
              color="fg.muted"
              fontFamily="mono"
              _hover={{ bg: 'bg.muted', color: 'fg' }}
            >
              Clear pin
            </Box>
          ) : null}
          <Box
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="8px"
            px={3}
            py={1}
            fontSize="13px"
            color="fg.muted"
            fontFamily="mono"
          >
            {formatCompactAmount(totalDelegated)}{' '}
            <Text as="span" color="fg.subtle">
              HP delegated
            </Text>
          </Box>
        </HStack>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }} gap={5} align="center">
        <Box
          position="relative"
          w={`${CHART_SIZE}px`}
          h={`${CHART_SIZE}px`}
          flexShrink={0}
          overflow="visible"
        >
          <Box ref={chartRef} w="full" h="full" />
          <Flex
            position="absolute"
            inset="0"
            align="center"
            justify="center"
            pointerEvents="none"
            direction="column"
            gap={3}
          >
            <Image
              src={`https://images.hive.blog/u/${centerAvatarAccount}/avatar/small`}
              alt={centerAvatarAccount}
              boxSize="58px"
              borderRadius="full"
              border="2px solid"
              borderColor={centerRingColor}
              objectFit="cover"
              filter="grayscale(18%) brightness(0.94)"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            <Stack gap={0.5} textAlign="center" align="center">
              <Text
                color="fg.muted"
                fontSize="11px"
                fontFamily="mono"
                letterSpacing="0.18em"
                textTransform="uppercase"
              >
                {activeSlice
                  ? formatPercent(activeSlice.hivePower, totalDelegated)
                  : `${slices.length} delegates`}
              </Text>
              <Text color="fg" fontSize="20px" fontWeight="700" lineHeight="1">
                {activeSlice
                  ? formatCompactAmount(activeSlice.hivePower)
                  : formatCompactAmount(totalDelegated)}
              </Text>
              <Text color="fg.muted" fontSize="12px" lineHeight="1">
                HP
              </Text>
            </Stack>
          </Flex>
        </Box>

        <Stack flex="1 1 220px" minW={0} gap={0.5} w="full">
          {slices.map((delegation) => (
            <Box key={delegation.delegatee}>
              <DelegationLegendRow
                delegation={delegation}
                totalDelegated={totalDelegated}
                isActive={activeDelegatee === delegation.delegatee}
                isPinned={pinnedDelegatee === delegation.delegatee}
                onPreview={() => previewDelegatee(delegation.delegatee)}
                onPreviewEnd={clearPreview}
                onTogglePin={() => togglePinnedDelegatee(delegation.delegatee)}
              />
              <Box h="1px" bg="border.subtle" mx={1.5} my={1} />
            </Box>
          ))}
        </Stack>
      </Flex>
    </Stack>
  )
}
