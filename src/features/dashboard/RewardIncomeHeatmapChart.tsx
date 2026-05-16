import { Box, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { HeatmapSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from 'echarts/components'
import { DASHBOARD_INCOME_PALETTE } from './chartPalette'
import type { DashboardBucket } from './types'

echarts.use([
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  SVGRenderer,
])

type RewardIncomeHeatmapChartProps = {
  buckets: Array<DashboardBucket>
}

type HeatmapSeriesDefinition = {
  key: 'authorRewards' | 'curationRewards' | 'savingsInterest'
  label: string
  colorToken: string
  scale: [string, string]
}

type RewardIncomeHeatmapOption = {
  animation: boolean
  grid: GridComponentOption
  tooltip: TooltipComponentOption
  visualMap: Array<VisualMapComponentOption>
  xAxis: object
  yAxis: object
  series: Array<HeatmapSeriesOption>
}

const SERIES: Array<HeatmapSeriesDefinition> = [
  {
    key: 'authorRewards',
    label: DASHBOARD_INCOME_PALETTE.author.label,
    colorToken: DASHBOARD_INCOME_PALETTE.author.colorToken,
    scale: ['#eef9f1', '#27ae60'],
  },
  {
    key: 'curationRewards',
    label: DASHBOARD_INCOME_PALETTE.curation.label,
    colorToken: DASHBOARD_INCOME_PALETTE.curation.colorToken,
    scale: ['#f3efff', '#8b5cf6'],
  },
  {
    key: 'savingsInterest',
    label: DASHBOARD_INCOME_PALETTE.interest.label,
    colorToken: DASHBOARD_INCOME_PALETTE.interest.colorToken,
    scale: ['#fff4e8', '#f08c2e'],
  },
]

const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

function resolveCssVar(varExpr: string, element: HTMLElement) {
  const match = varExpr.match(/var\((--[^)]+)\)/)
  if (!match) return varExpr
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || '#888888'
}

function formatTokenAmount(value: number, digits = 2) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export default function RewardIncomeHeatmapChart({
  buckets,
}: RewardIncomeHeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const hasData = useMemo(
    () =>
      buckets.some(
        (bucket) =>
          bucket.authorRewards > 0 ||
          bucket.curationRewards > 0 ||
          bucket.savingsInterest > 0,
      ),
    [buckets],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || !hasData) return
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
  }, [hasData])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || !hasData) return

    const color = (token: string) => resolveCssVar(token, container)
    const labels = buckets.map((bucket) => bucket.shortLabel)
    const borderColor = color(semanticVar('bg'))

    const series: Array<HeatmapSeriesOption> = SERIES.map((definition, seriesIndex) => ({
      name: definition.label,
      type: 'heatmap',
      coordinateSystem: 'cartesian2d',
      seriesIndex,
      progressive: 0,
      emphasis: { disabled: true },
      itemStyle: {
        borderRadius: 6,
        borderWidth: 2,
        borderColor,
      },
      data: buckets.map((bucket, bucketIndex) => [
        bucketIndex,
        seriesIndex,
        bucket[definition.key],
      ]),
    }))

    const visualMap: Array<VisualMapComponentOption> = SERIES.map(
      (definition, seriesIndex) => {
        const max = Math.max(...buckets.map((bucket) => bucket[definition.key]), 0)

        return {
          show: false,
          type: 'continuous',
          seriesIndex,
          min: 0,
          max: max <= 0 ? 1 : Number(max.toFixed(2)),
          inRange: {
            color: definition.scale,
          },
        }
      },
    )

    const option: RewardIncomeHeatmapOption = {
      animation: false,
      grid: {
        top: 8,
        right: 8,
        bottom: 0,
        left: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: color(semanticVar('bg.panel')),
        borderColor: color(semanticVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
        },
        formatter: (params) => {
          const payload = params as {
            value?: [number, number, number]
            seriesName?: string
            seriesIndex?: number
          }
          const [xIndex, , rawValue] = payload.value ?? [0, 0, 0]
          const bucket = buckets[Number(xIndex)]
          const definition = SERIES[Number(payload.seriesIndex ?? 0)]
          const total =
            (bucket?.authorRewards ?? 0) +
            (bucket?.curationRewards ?? 0) +
            (bucket?.savingsInterest ?? 0)

          return `
            <div style="font-weight:600;margin-bottom:6px;">${bucket?.longLabel ?? ''}</div>
            <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;">
              <span style="display:inline-flex;align-items:center;gap:8px;">
                <span style="width:9px;height:9px;border-radius:999px;background:${color(
                  tokenVar(definition.colorToken),
                )};display:inline-block;"></span>
                <span>${payload.seriesName ?? definition.label}</span>
              </span>
              <span>${formatTokenAmount(Number(rawValue ?? 0), 2)} HBD</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;padding-top:6px;border-top:1px solid ${color(
              semanticVar('border.subtle'),
            )};">
              <span>Total</span>
              <span>${formatTokenAmount(total, 2)} HBD</span>
            </div>
          `
        },
      },
      visualMap,
      xAxis: {
        type: 'category',
        data: labels,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color(semanticVar('fg.subtle')),
          fontSize: 11,
          margin: 12,
        },
      },
      yAxis: {
        type: 'category',
        data: SERIES.map((definition) => definition.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color(semanticVar('fg.muted')),
          fontSize: 11,
          margin: 12,
        },
        splitArea: { show: false },
      },
      series,
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [buckets, hasData])

  if (!hasData) {
    return null
  }

  return (
    <Stack gap={2}>
      <Text
        fontSize="xs"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="0.16em"
        fontFamily="mono"
      >
        Heatmap
      </Text>
      <Box
        ref={chartRef}
        h="10.5rem"
        w="full"
        borderRadius="16px"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="bg.subtle"
        px={2}
        py={2}
      />
    </Stack>
  )
}
