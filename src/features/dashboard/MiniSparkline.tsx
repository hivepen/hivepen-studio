import { Box } from '@chakra-ui/react'
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
import { GridComponent } from 'echarts/components'

echarts.use([LineChart, BarChart, GridComponent, SVGRenderer])

const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

function resolveCssVar(varExpr: string, el: HTMLElement): string {
  const match = varExpr.match(/var\((--[^)]+)\)/)
  if (!match) return varExpr
  return getComputedStyle(el).getPropertyValue(match[1]).trim() || '#888'
}

export type MiniSparklineProps = {
  data: Array<number>
  colorToken: string
  type?: 'area' | 'bar'
  height?: number
}

export default function MiniSparkline({
  data,
  colorToken,
  type = 'area',
  height = 36,
}: MiniSparklineProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container || data.length < 2) return
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('jsdom')
    )
      return

    const instance = echarts.init(container, undefined, { renderer: 'svg' })
    const resolve = (v: string) => resolveCssVar(v, container)
    const c = resolve(tokenVar(colorToken))
    const max = Math.max(...data, 0.001)

    instance.setOption({
      animation: false,
      grid: { top: 2, bottom: 2, left: 0, right: 0 },
      xAxis: {
        type: 'category',
        show: false,
        data: data.map((_, i) => i),
      },
      yAxis: { type: 'value', show: false, min: 0, max },
      series:
        type === 'bar'
          ? [
              {
                type: 'bar',
                data,
                itemStyle: {
                  color: c,
                  opacity: 0.85,
                  borderRadius: [2, 2, 0, 0],
                },
                barWidth: '60%',
              },
            ]
          : [
              {
                type: 'line',
                data,
                smooth: 0.4,
                symbol: 'none',
                lineStyle: { color: c, width: 1.5 },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: c + '55' },
                      { offset: 1, color: c + '00' },
                    ],
                  },
                },
              },
            ],
    })

    return () => {
      instance.dispose()
    }
  }, [data, colorToken, type])

  return <Box ref={ref} h={`${height}px`} w="full" />
}
