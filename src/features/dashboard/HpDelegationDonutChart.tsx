import { Box, HStack, Image, Stack, Text } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
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
  delegations: Array<DashboardDelegation>
  ownHivePower: number
}

const tokenVar = (token: string) =>
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

export default function HpDelegationDonutChart({
  delegations,
  ownHivePower,
}: HpDelegationDonutChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)
  const totalDelegated = delegations.reduce(
    (sum, delegation) => sum + delegation.hivePower,
    0,
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container || delegations.length === 0) return
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
  }, [delegations.length])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || delegations.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const pieData = delegations.map((delegation, index) => ({
      value: Number(delegation.hivePower.toFixed(3)),
      name: `@${delegation.delegatee}`,
      itemStyle: {
        color: color(
          tokenVar(
            DASHBOARD_DELEGATION_SLICE_TOKENS[
              index % DASHBOARD_DELEGATION_SLICE_TOKENS.length
            ],
          ),
        ),
      },
    }))

    const option: DelegationDonutChartOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: color(tokenVar('bg.panel')),
        borderColor: color(tokenVar('border.subtle')),
        borderWidth: 1,
        textStyle: {
          color: color(tokenVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
          fontSize: 11,
        },
        formatter: (params) => {
          if (Array.isArray(params)) return ''
          const shareOfOwned =
            ownHivePower > 0
              ? `${((Number(params.value) / ownHivePower) * 100).toFixed(1)}%`
              : '0%'

          return [
            `<div style="font-weight:600;margin-bottom:6px;">${params.name}</div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Delegated</span><span>${formatCompactAmount(
              Number(params.value),
            )} HP</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Share of delegated</span><span>${Number(
              params.percent ?? 0,
            ).toFixed(1)}%</span></div>`,
            `<div style="display:flex;justify-content:space-between;gap:16px;"><span>Share of owned HP</span><span>${shareOfOwned}</span></div>`,
          ].join('')
        },
      },
      series: [
        {
          name: 'Outgoing HP delegations',
          type: 'pie',
          radius: ['42%', '72%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: false,
          padAngle: 4,
          minAngle: 3,
          itemStyle: {
            borderRadius: 10,
            borderColor: color(tokenVar('bg.panel')),
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
            color: color(tokenVar('fg')),
            formatter: ({ name, value }) =>
              `${name}\n${formatCompactAmount(Number(value ?? 0))} HP`,
            rich: {
              value: {
                fontSize: 12,
                color: color(tokenVar('fg.subtle')),
              },
            },
          },
          emphasis: {
            scale: false,
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 22,
            },
          },
          labelLine: {
            show: false,
          },
          data: pieData,
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [delegations, ownHivePower])

  if (delegations.length === 0) {
    return null
  }

  return (
    <Stack gap={3}>
      <Box ref={chartRef} h="16rem" w="full" />

      <HStack justify="space-between" wrap="wrap" gap={3}>
        <Text fontSize="xs" color="fg.muted" fontFamily="mono">
          {delegations.length} delegatees
        </Text>
        <Text fontSize="xs" color="teal.fg" fontFamily="mono">
          {formatCompactAmount(totalDelegated)} HP delegated
        </Text>
      </HStack>

      <Stack gap={1.5}>
        {delegations.slice(0, 8).map((delegation, index) => {
          const colorToken =
            DASHBOARD_DELEGATION_SLICE_TOKENS[
              index % DASHBOARD_DELEGATION_SLICE_TOKENS.length
            ]

          return (
            <HStack
              key={delegation.delegatee}
              justify="space-between"
              gap={3}
              minW={0}
            >
              <HStack gap={2.5} minW={0}>
                <Image
                  src={`https://images.hive.blog/u/${delegation.delegatee}/avatar/small`}
                  alt={delegation.delegatee}
                  boxSize="20px"
                  borderRadius="full"
                  border="1.5px solid"
                  borderColor={colorToken}
                  objectFit="cover"
                  filter="grayscale(20%) brightness(0.92)"
                  flexShrink={0}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
                <Text fontSize="xs" color="fg.muted" fontFamily="mono" lineClamp={1}>
                  @{delegation.delegatee}
                </Text>
              </HStack>

              <HStack gap={2} flexShrink={0}>
                <Box boxSize="8px" borderRadius="full" bg={colorToken} />
                <Text
                  fontSize="xs"
                  fontFamily="mono"
                  color="fg"
                  whiteSpace="nowrap"
                >
                  {formatCompactAmount(delegation.hivePower)} HP
                </Text>
              </HStack>
            </HStack>
          )
        })}
      </Stack>
    </Stack>
  )
}
