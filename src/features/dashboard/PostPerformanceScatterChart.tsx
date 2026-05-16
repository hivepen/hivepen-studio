import { Box } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { ScatterSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { DASHBOARD_INCOME_PALETTE } from './chartPalette'
import type { DashboardTopPost } from './types'

echarts.use([ScatterChart, GridComponent, TooltipComponent, SVGRenderer])

type PostPerformanceScatterChartProps = {
  posts: Array<DashboardTopPost>
}

type PostPerformanceOption = {
  animation: boolean
  grid: GridComponentOption
  tooltip: TooltipComponentOption
  xAxis: object
  yAxis: object
  series: Array<ScatterSeriesOption>
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

export default function PostPerformanceScatterChart({
  posts,
}: PostPerformanceScatterChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const chartPosts = useMemo(
    () => posts.filter((post) => post.totalReward > 0),
    [posts],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || chartPosts.length === 0) return
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
  }, [chartPosts.length])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || chartPosts.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const bubbleColor = color(tokenVar(DASHBOARD_INCOME_PALETTE.author.colorToken))
    const muted = color(semanticVar('fg.muted'))
    const subtle = color(semanticVar('fg.subtle'))
    const border = color(semanticVar('border.muted'))
    const bg = color(semanticVar('bg'))

    const option: PostPerformanceOption = {
      animation: false,
      grid: {
        top: 12,
        right: 12,
        bottom: 10,
        left: 10,
        containLabel: true,
      },
      tooltip: {
        backgroundColor: color(semanticVar('bg.panel')),
        borderColor: color(semanticVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
        },
        formatter: (params) => {
          const payload = params as {
            data?: {
              title: string
              totalReward: number
              votes: number
              comments: number
              community: string | null
            }
          }
          const point = payload.data
          if (!point) return ''

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${point.title}</div>`,
            point.community
              ? `<div style="color:${muted};margin-bottom:6px;">${point.community}</div>`
              : '',
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Payout</span><span>${formatTokenAmount(
              point.totalReward,
              2,
            )} HBD</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Votes</span><span>${point.votes}</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Comments</span><span>${point.comments}</span></div>`,
          ].join('')
        },
      },
      xAxis: {
        type: 'value',
        name: 'Payout (HBD)',
        nameLocation: 'middle',
        nameGap: 28,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: subtle,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: border,
            type: 'dashed',
          },
        },
        nameTextStyle: {
          color: muted,
          fontFamily: 'var(--chakra-fonts-mono)',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Votes',
        nameGap: 14,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: subtle,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: border,
            type: 'dashed',
          },
        },
        nameTextStyle: {
          color: muted,
          fontFamily: 'var(--chakra-fonts-mono)',
          fontSize: 11,
        },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (value) => {
            const comments = Number((value as Array<number>)[2] ?? 0)
            return 10 + Math.sqrt(Math.max(comments, 0)) * 6
          },
          itemStyle: {
            color: bubbleColor,
            opacity: 0.82,
            borderColor: bg,
            borderWidth: 1.5,
          },
          emphasis: { disabled: true },
          data: chartPosts.map((post) => ({
            value: [post.totalReward, post.votes, post.comments],
            title: post.title,
            totalReward: post.totalReward,
            votes: post.votes,
            comments: post.comments,
            community: post.communityTitle ?? null,
          })),
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [chartPosts])

  if (chartPosts.length === 0) {
    return null
  }

  return <Box ref={chartRef} h="16rem" w="full" />
}
