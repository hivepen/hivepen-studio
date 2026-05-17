import { Box, HStack, Text } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { HeatmapSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type { ComposeOption, EChartsType } from 'echarts/core'
import type { DashboardDailyPostCount } from './types'

echarts.use([HeatmapChart, GridComponent, TooltipComponent, SVGRenderer])

type PublishingCadenceChartOption = ComposeOption<
  HeatmapSeriesOption | TooltipComponentOption
>

type PublishingCadenceChartProps = {
  dailyPostCounts: Array<DashboardDailyPostCount>
}

const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

function resolveCssVar(varExpr: string, element: HTMLElement): string {
  const match = varExpr.match(/var\((--[^)]+)\)/)
  if (!match) return varExpr
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || '#888888'
}

export default function PublishingCadenceChart({
  dailyPostCounts,
}: PublishingCadenceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const hasActivity = dailyPostCounts.some(
    (day) => day.posts > 0 || day.comments > 0,
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || !hasActivity) return
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
  }, [hasActivity])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || !hasActivity) return

    const color = (token: string) => resolveCssVar(token, container)
    const muted = color(semanticVar('fg.muted'))
    const subtle = color(semanticVar('fg.subtle'))
    const bg = color(semanticVar('bg'))

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeks: Array<Array<string>> = []
    const data: Array<[number, number, number]> = []

    const sortedDays = [...dailyPostCounts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    if (sortedDays.length === 0) return

    const firstDay = new Date(sortedDays[0].date)
    const startDayOfWeek = firstDay.getDay()

    let currentWeek: Array<string> = []
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push('')
    }

    for (const [index, day] of sortedDays.entries()) {
      const date = new Date(day.date)
      const dayOfWeek = date.getDay()
      const weekIndex = Math.floor((index + startDayOfWeek) / 7)

      while (weeks.length <= weekIndex) {
        weeks.push([...currentWeek])
        currentWeek = []
      }

      const total = day.posts + day.comments
      weeks[weekIndex][dayOfWeek] = day.date
      data.push([weekIndex, dayOfWeek, total])
    }

    const maxValue = Math.max(3, ...data.map((d) => d[2]))

    const option: PublishingCadenceChartOption = {
      animation: false,
      tooltip: {
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
          const point = Array.isArray(params.data)
            ? (params.data as [number, number, number])
            : undefined
          if (!point || point[2] === 0) return ''
          const dayData = sortedDays.find((d) => {
            const date = new Date(d.date)
            return date.getDay() === point[1]
          })
          if (!dayData) return ''
          const dateStr = new Date(dayData.date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
          return `${dateStr}<br/><strong>${dayData.posts} posts</strong><br/>${dayData.comments} comments`
        },
      },
      grid: {
        top: 8,
        bottom: 24,
        left: 32,
        right: 8,
      },
      xAxis: {
        type: 'category',
        data: weeks.map((_, i) => `W${i + 1}`),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: subtle,
          fontSize: 10,
          interval: 0,
        },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: daysOfWeek,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 10,
        },
        splitArea: { show: false },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        show: false,
        inRange: {
          color: [
            bg,
            color(tokenVar('purple.subtle')),
            color(tokenVar('purple.emphasized')),
            color(tokenVar('purple.solid')),
          ],
        },
      },
      series: [
        {
          type: 'heatmap',
          data,
          itemStyle: {
            borderRadius: 2,
            borderColor: color(semanticVar('bg.panel')),
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              borderColor: color(semanticVar('fg')),
              borderWidth: 1.5,
            },
          },
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [dailyPostCounts, hasActivity])

  if (!hasActivity) {
    return null
  }

  return (
    <Box>
      <Box ref={chartRef} h="14rem" w="full" />
      <HStack gap={4} justify="center" mt={2}>
        <HStack gap={1}>
          <Box w="10px" h="10px" borderRadius="1px" bg="bg" />
          <Text fontSize="xs" color="fg.muted">0</Text>
        </HStack>
        <HStack gap={1}>
          <Box w="10px" h="10px" borderRadius="1px" bg="purple.subtle" />
          <Text fontSize="xs" color="fg.muted">1-2</Text>
        </HStack>
        <HStack gap={1}>
          <Box w="10px" h="10px" borderRadius="1px" bg="purple.emphasized" />
          <Text fontSize="xs" color="fg.muted">3-5</Text>
        </HStack>
        <HStack gap={1}>
          <Box w="10px" h="10px" borderRadius="1px" bg="purple.solid" />
          <Text fontSize="xs" color="fg.muted">6+</Text>
        </HStack>
      </HStack>
    </Box>
  )
}
