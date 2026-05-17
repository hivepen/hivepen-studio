import { Box, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { HeatmapChart, ScatterChart } from 'echarts/charts'
import {
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { HeatmapSeriesOption, ScatterSeriesOption } from 'echarts/charts'
import type {
  CalendarComponentOption,
  TooltipComponentOption,
  VisualMapComponentOption,
} from 'echarts/components'
import { DASHBOARD_INCOME_PALETTE } from './chartPalette'
import type { DashboardDailyIncomeDay } from './types'

// NOTE: this is a daily INCOME calendar heatmap, not a vote-cast timing heatmap.
// Vote-cast timing is tracked in roadmap Phase 2 pending API verification.

echarts.use([
  HeatmapChart,
  ScatterChart,
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  SVGRenderer,
])

type RewardIncomeHeatmapChartProps = {
  dailyIncome: Array<DashboardDailyIncomeDay>
}

type OverlayDefinition = {
  key: 'authorRewards' | 'curationRewards' | 'savingsInterest'
  label: string
  colorToken: string
  yOffset: number
}

type RewardIncomeHeatmapOption = {
  animation: boolean
  calendar: CalendarComponentOption
  tooltip: TooltipComponentOption
  visualMap: VisualMapComponentOption
  series: Array<HeatmapSeriesOption | ScatterSeriesOption>
}

const OVERLAYS: Array<OverlayDefinition> = [
  {
    key: 'authorRewards',
    label: DASHBOARD_INCOME_PALETTE.author.label,
    colorToken: DASHBOARD_INCOME_PALETTE.author.colorToken,
    yOffset: -7,
  },
  {
    key: 'curationRewards',
    label: DASHBOARD_INCOME_PALETTE.curation.label,
    colorToken: DASHBOARD_INCOME_PALETTE.curation.colorToken,
    yOffset: 0,
  },
  {
    key: 'savingsInterest',
    label: DASHBOARD_INCOME_PALETTE.interest.label,
    colorToken: DASHBOARD_INCOME_PALETTE.interest.colorToken,
    yOffset: 7,
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

function formatRange(dailyIncome: Array<DashboardDailyIncomeDay>) {
  const first = dailyIncome[0]
  const last = dailyIncome[dailyIncome.length - 1]
  if (!first || !last) return ''

  const start = first.date.slice(0, 10)
  const end = last.date.slice(0, 10)
  return start === end ? start : [start, end]
}

export default function RewardIncomeHeatmapChart({
  dailyIncome,
}: RewardIncomeHeatmapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const hasData = useMemo(
    () => dailyIncome.some((day) => day.totalRewards > 0),
    [dailyIncome],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || dailyIncome.length === 0) return
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
  }, [dailyIncome.length])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || dailyIncome.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const maxTotal = Math.max(...dailyIncome.map((day) => day.totalRewards), 0)

    const totalHeatmapData = dailyIncome.map((day) => [day.date.slice(0, 10), day.totalRewards])

    const overlaySeries: Array<ScatterSeriesOption> = OVERLAYS.map((overlay) => {
      const maxForType = Math.max(...dailyIncome.map((day) => day[overlay.key]), 0)

      return {
        name: overlay.label,
        type: 'scatter',
        coordinateSystem: 'calendar',
        symbol: 'roundRect',
        symbolSize: [14, 4],
        symbolOffset: [0, overlay.yOffset],
        itemStyle: {
          color: color(tokenVar(overlay.colorToken)),
          borderRadius: 999,
        },
        emphasis: { disabled: true },
        data: dailyIncome
          .filter((day) => day[overlay.key] > 0)
          .map((day) => ({
            value: [day.date.slice(0, 10), day[overlay.key]],
            itemStyle: {
              opacity:
                maxForType <= 0
                  ? 0
                  : 0.25 + 0.75 * (day[overlay.key] / maxForType),
            },
          })),
      }
    })

    const option: RewardIncomeHeatmapOption = {
      animation: false,
      calendar: {
        top: 8,
        left: 8,
        right: 8,
        bottom: 8,
        range: formatRange(dailyIncome),
        orient: 'horizontal',
        splitLine: {
          show: false,
        },
        itemStyle: {
          color: color(semanticVar('bg.subtle')),
          borderWidth: 2,
          borderColor: color(semanticVar('bg')),
          borderRadius: 8,
        },
        dayLabel: {
          firstDay: 1,
          nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          color: color(semanticVar('fg.subtle')),
          margin: 10,
        },
        monthLabel: {
          color: color(semanticVar('fg.muted')),
          margin: 12,
        },
        yearLabel: {
          show: false,
        },
        cellSize: ['auto', 24],
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
          const payload = params as { value?: Array<string | number> | string | number }
          const raw = payload.value
          const dateKey = Array.isArray(raw) ? String(raw[0] ?? '') : ''
          const day = dailyIncome.find((entry) => entry.date.startsWith(dateKey))
          if (!day) return ''

          const rows = OVERLAYS.map(
            (overlay) => `
              <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;">
                <span style="display:inline-flex;align-items:center;gap:8px;">
                  <span style="width:9px;height:9px;border-radius:999px;background:${color(
                    tokenVar(overlay.colorToken),
                  )};display:inline-block;"></span>
                  <span>${overlay.label}</span>
                </span>
                <span>${formatTokenAmount(day[overlay.key], 2)} HBD</span>
              </div>
            `,
          )

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${dateKey}</div>`,
            ...rows,
            `<div style="display:flex;justify-content:space-between;gap:16px;margin-top:6px;padding-top:6px;border-top:1px solid ${color(
              semanticVar('border.subtle'),
            )};">
              <span>Total</span>
              <span>${formatTokenAmount(day.totalRewards, 2)} HBD</span>
            </div>`,
          ].join('')
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxTotal <= 0 ? 1 : Number(maxTotal.toFixed(2)),
        seriesIndex: 0,
        inRange: {
          color: ['#f4f7ff', '#5b7cfa'],
        },
      },
      series: [
        {
          name: 'Total rewards',
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: totalHeatmapData,
          progressive: 0,
          emphasis: { disabled: true },
        },
        ...overlaySeries,
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [dailyIncome])

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
        Daily heatmap
      </Text>
      <Box
        ref={chartRef}
        h="14rem"
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
