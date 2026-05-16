import { Box, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { DashboardBucket } from './types'

echarts.use([BarChart, GridComponent, TooltipComponent, SVGRenderer])

type RewardIncomeStackedChartProps = {
  buckets: Array<DashboardBucket>
}

type RewardIncomeStackedOption = {
  animation: boolean
  grid: GridComponentOption
  tooltip: TooltipComponentOption
  xAxis: object
  yAxis: object
  series: Array<BarSeriesOption>
}

type SeriesDefinition = {
  key: 'authorRewards' | 'curationRewards' | 'savingsInterest'
  label: string
  colorToken: string
}

const SERIES: Array<SeriesDefinition> = [
  { key: 'authorRewards', label: 'Author', colorToken: 'green.solid' },
  { key: 'curationRewards', label: 'Curation', colorToken: 'purple.solid' },
  { key: 'savingsInterest', label: 'Interest', colorToken: 'yellow.solid' },
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

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
}

export default function RewardIncomeStackedChart({
  buckets,
}: RewardIncomeStackedChartProps) {
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

    const topSeriesIndexByBucket = buckets.map((bucket) => {
      let topIndex = -1
      for (let seriesIndex = 0; seriesIndex < SERIES.length; seriesIndex += 1) {
        const value = bucket[SERIES[seriesIndex].key]
        if (value > 0) {
          topIndex = seriesIndex
        }
      }
      return topIndex
    })

    const series: Array<BarSeriesOption> = SERIES.map((definition, seriesIndex) => ({
      name: definition.label,
      type: 'bar',
      stack: 'reward-income',
      barWidth: '58%',
      emphasis: { disabled: true },
      itemStyle: {
        color: color(tokenVar(definition.colorToken)),
      },
      data: buckets.map((bucket, bucketIndex) => {
        const value = bucket[definition.key]
        const isTop = topSeriesIndexByBucket[bucketIndex] === seriesIndex

        return {
          value,
          itemStyle: {
            borderRadius: isTop ? [10, 10, 0, 0] : 0,
          },
        }
      }),
    }))

    const option: RewardIncomeStackedOption = {
      animation: false,
      grid: {
        top: 10,
        right: 10,
        bottom: 0,
        left: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: color(semanticVar('bg.subtle')),
            opacity: 0.65,
          },
        },
        backgroundColor: color(semanticVar('bg.panel')),
        borderColor: color(semanticVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
        },
        formatter: (params) => {
          const items = Array.isArray(params) ? params : [params]
          const bucketIndex = Number(items[0]?.dataIndex ?? 0)
          const bucket = buckets[bucketIndex]
          const rows = SERIES.map((definition) => {
            const value = bucket?.[definition.key] ?? 0
            if (value <= 0) return null

            return `<div style="display:flex;justify-content:space-between;gap:16px;">
              <span>${definition.label}</span>
              <span>${formatTokenAmount(value, 2)} HBD</span>
            </div>`
          }).filter(Boolean)

          const total =
            (bucket?.authorRewards ?? 0) +
            (bucket?.curationRewards ?? 0) +
            (bucket?.savingsInterest ?? 0)

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${bucket?.longLabel ?? ''}</div>`,
            ...rows,
            `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;padding-top:6px;border-top:1px solid ${color(
              semanticVar('border.subtle'),
            )};">
              <span>Total</span>
              <span>${formatTokenAmount(total, 2)} HBD</span>
            </div>`,
          ].join('')
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color(semanticVar('fg.subtle')),
          fontSize: 11,
          margin: 12,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: color(semanticVar('border.muted')),
          },
        },
        axisLabel: {
          color: color(semanticVar('fg.subtle')),
          fontSize: 11,
          formatter: (value: number) => formatCompactCurrency(Number(value)),
        },
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
        Composition
      </Text>
      <Box
        ref={chartRef}
        h="12rem"
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
