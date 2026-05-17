import { Box, HStack, Stack, Text } from '@chakra-ui/react'
import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { TreemapSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type { DashboardCommunityRewardBreakdown } from './types'

echarts.use([TreemapChart, TooltipComponent, SVGRenderer])

type CommunityRewardBreakdownChartProps = {
  communities: Array<DashboardCommunityRewardBreakdown>
}

type CommunityRewardBreakdownOption = {
  animation: boolean
  tooltip: TooltipComponentOption
  series: Array<TreemapSeriesOption>
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

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0.0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

export default function CommunityRewardBreakdownChart({
  communities,
}: CommunityRewardBreakdownChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)

  const chartCommunities = useMemo(
    () => communities.filter((community) => community.totalRewards > 0),
    [communities],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || chartCommunities.length === 0) return
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
  }, [chartCommunities.length])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || chartCommunities.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const totalRewards = chartCommunities.reduce(
      (sum, community) => sum + community.totalRewards,
      0,
    )

    const option: CommunityRewardBreakdownOption = {
      animation: false,
      tooltip: {
        backgroundColor: color(semanticVar('bg.panel')),
        borderColor: color(semanticVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
        },
        formatter: (params) => {
          const point = params as {
            name?: string
            treePathInfo?: Array<{ name?: string }>
            value?: number
          }
          const treePath = point.treePathInfo ?? []
          const communityLabel =
            treePath[1]?.name ?? point.name ?? 'Unattributed'
          const segmentLabel =
            treePath.length > 2 ? point.name ?? 'Reward' : 'Total rewards'
          const value = Number(point.value ?? 0)

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${communityLabel}</div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>${segmentLabel}</span><span>${formatTokenAmount(
              value,
              2,
            )} HBD</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Share</span><span>${formatPercent(
              value,
              totalRewards,
            )}</span></div>`,
          ].join('')
        },
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          label: {
            show: true,
            formatter: '{b}',
            color: color(semanticVar('fg')),
            fontSize: 12,
            overflow: 'truncate',
          },
          upperLabel: {
            show: true,
            height: 22,
            color: color(semanticVar('fg')),
            fontSize: 12,
            fontWeight: 'bold',
          },
          itemStyle: {
            borderColor: color(semanticVar('bg.panel')),
            borderWidth: 2,
            gapWidth: 2,
          },
          levels: [
            {
              colorAlpha: [0.92, 0.92],
              itemStyle: {
                borderColor: color(semanticVar('bg.panel')),
                borderWidth: 3,
                gapWidth: 3,
              },
            },
            {
              colorSaturation: [0.35, 0.6],
              itemStyle: {
                borderColor: color(semanticVar('bg.panel')),
                borderWidth: 2,
                gapWidth: 2,
              },
            },
          ],
          data: chartCommunities.map((community) => ({
            name: community.label,
            value: community.totalRewards,
            itemStyle: {
              color:
                community.commentRewards > 0 && community.postRewards > 0
                  ? color(tokenVar('green.emphasized'))
                  : community.commentRewards > 0
                    ? color(tokenVar('green.subtle'))
                    : color(tokenVar('green.solid')),
            },
            children: [
              ...(community.postRewards > 0
                ? [
                    {
                      name: 'Posts',
                      value: community.postRewards,
                      itemStyle: {
                        color: color(tokenVar('green.solid')),
                      },
                    },
                  ]
                : []),
              ...(community.commentRewards > 0
                ? [
                    {
                      name: 'Comments',
                      value: community.commentRewards,
                      itemStyle: {
                        color: color(tokenVar('green.subtle')),
                      },
                    },
                  ]
                : []),
            ],
          })),
          emphasis: { disabled: true },
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [chartCommunities])

  if (chartCommunities.length === 0) {
    return null
  }

  return (
    <Box>
      <Box ref={chartRef} h="18rem" w="full" />
      <Stack gap={1.5} mt={3}>
        {chartCommunities.slice(0, 6).map((community) => (
          <HStack key={community.id} gap={2} justify="space-between">
            <HStack gap={2} minW={0}>
              <Box
                as="img"
                src={`https://images.hive.blog/u/${community.id}/avatar/small`}
                alt={community.label}
                boxSize="18px"
                borderRadius="full"
                border="1.5px solid"
                borderColor="green.subtle"
                objectFit="cover"
                filter="grayscale(20%)"
                flexShrink={0}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                {community.label}
              </Text>
            </HStack>
            <Text fontSize="xs" fontFamily="mono" color="fg" flexShrink={0}>
              {formatTokenAmount(community.totalRewards, 2)} HBD
            </Text>
          </HStack>
        ))}
      </Stack>
    </Box>
  )
}
