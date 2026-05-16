import { Box } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BoxplotChart, ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { BoxplotSeriesOption, ScatterSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { DashboardPayoutDistributionBucket } from './types'

echarts.use([
  BoxplotChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  SVGRenderer,
])

type PayoutDistributionChartProps = {
  buckets: Array<DashboardPayoutDistributionBucket>
}

type PayoutDistributionOption = {
  animation: boolean
  grid: GridComponentOption
  tooltip: TooltipComponentOption
  xAxis: object
  yAxis: object
  series: Array<BoxplotSeriesOption | ScatterSeriesOption>
}

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

function quantile(sortedValues: Array<number>, fraction: number) {
  if (sortedValues.length === 0) return 0
  if (sortedValues.length === 1) return sortedValues[0]

  const position = (sortedValues.length - 1) * fraction
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const weight = position - lowerIndex
  const lower = sortedValues[lowerIndex] ?? 0
  const upper = sortedValues[upperIndex] ?? lower

  return lower + (upper - lower) * weight
}

function summarizeBucket(values: Array<number>) {
  const sorted = values.slice().sort((left, right) => left - right)
  const min = sorted[0] ?? 0
  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const max = sorted[sorted.length - 1] ?? 0
  const iqr = q3 - q1
  const lowerFence = q1 - iqr * 1.5
  const upperFence = q3 + iqr * 1.5

  const whiskerLow = sorted.find((value) => value >= lowerFence) ?? min
  const whiskerHigh =
    sorted
      .slice()
      .reverse()
      .find((value) => value <= upperFence) ?? max

  const outliers = sorted.filter(
    (value) => value < whiskerLow || value > whiskerHigh,
  )

  return {
    box: [whiskerLow, q1, median, q3, whiskerHigh] as const,
    count: sorted.length,
    max,
    outliers,
  }
}

export default function PayoutDistributionChart({
  buckets,
}: PayoutDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const chartBuckets = useMemo(
    () => buckets.filter((bucket) => bucket.rewards.length > 0),
    [buckets],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || chartBuckets.length === 0) return
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
  }, [chartBuckets.length])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || chartBuckets.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const summaries = chartBuckets.map((bucket) => summarizeBucket(bucket.rewards))

    const option: PayoutDistributionOption = {
      animation: false,
      grid: {
        top: 14,
        right: 10,
        bottom: 0,
        left: 10,
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
          const point = params as {
            dataIndex?: number
            seriesName?: string
            value?: number | Array<number>
          }
          const dataIndex = Number(point.dataIndex ?? 0)
          const bucket = chartBuckets[dataIndex]
          const summary = summaries[dataIndex]

          if (point.seriesName === 'Outliers') {
            const outlierValue = Array.isArray(point.value)
              ? Number(point.value[1] ?? 0)
              : Number(point.value ?? 0)

            return [
              `<div style="font-weight:600;margin-bottom:6px;">${bucket.longLabel}</div>`,
              `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Outlier payout</span><span>${formatTokenAmount(
                outlierValue,
                2,
              )} HBD</span></div>`,
            ].join('')
          }

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${bucket.longLabel}</div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Posts</span><span>${summary.count}</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Median</span><span>${formatTokenAmount(
              summary.box[2],
              2,
            )} HBD</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Middle 50%</span><span>${formatTokenAmount(
              summary.box[1],
              2,
            )} to ${formatTokenAmount(summary.box[3], 2)} HBD</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Whiskers</span><span>${formatTokenAmount(
              summary.box[0],
              2,
            )} to ${formatTokenAmount(summary.box[4], 2)} HBD</span></div>`,
          ].join('')
        },
      },
      xAxis: {
        type: 'category',
        data: chartBuckets.map((bucket) => bucket.shortLabel),
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
        name: 'Post payout (HBD)',
        nameGap: 14,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color(semanticVar('fg.subtle')),
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: color(semanticVar('border.muted')),
            type: 'dashed',
          },
        },
        nameTextStyle: {
          color: color(semanticVar('fg.muted')),
          fontFamily: 'var(--chakra-fonts-mono)',
          fontSize: 11,
        },
      },
      series: [
        {
          name: 'Distribution',
          type: 'boxplot',
          data: summaries.map((summary) => Array.from(summary.box)),
          itemStyle: {
            color: color(tokenVar('orange.subtle')),
            borderColor: color(tokenVar('orange.solid')),
            borderWidth: 1.5,
          },
          emphasis: { disabled: true },
        },
        {
          name: 'Outliers',
          type: 'scatter',
          data: summaries.flatMap((summary, bucketIndex) =>
            summary.outliers.map((value) => [bucketIndex, value]),
          ),
          symbolSize: 9,
          itemStyle: {
            color: color(tokenVar('orange.solid')),
            opacity: 0.9,
          },
          emphasis: { disabled: true },
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [chartBuckets])

  if (chartBuckets.length === 0) {
    return null
  }

  return <Box ref={chartRef} h="16rem" w="full" />
}
