import { Box, Checkbox, HStack, Image, Stack, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import type { EChartsType } from 'echarts/core'
import type { TreemapSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type { DashboardCommunityRewardBreakdown } from './types'

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer])

type CommunityRewardBreakdownChartProps = {
  communities: Array<DashboardCommunityRewardBreakdown>
}

type CommunityRewardBreakdownOption = {
  animation: boolean
  tooltip: TooltipComponentOption
  series: Array<TreemapSeriesOption>
}

const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

const TEXTURE_SIZE = 320

type EChartsPatternColor = {
  image: HTMLCanvasElement
  repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
}

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

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  destinationWidth: number,
  destinationHeight: number,
) {
  const sourceWidth =
    image instanceof HTMLImageElement ? image.naturalWidth : destinationWidth
  const sourceHeight =
    image instanceof HTMLImageElement ? image.naturalHeight : destinationHeight

  if (sourceWidth <= 0 || sourceHeight <= 0) return

  const scale = Math.max(
    destinationWidth / sourceWidth,
    destinationHeight / sourceHeight,
  )
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const offsetX = (destinationWidth - drawWidth) / 2
  const offsetY = (destinationHeight - drawHeight) / 2

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
}

function buildBlurredTexture(sourceImage: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE
  const context = canvas.getContext('2d')

  if (!context) {
    return null
  }

  context.clearRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.filter = 'blur(22px) saturate(1.05)'
  drawCoverImage(context, sourceImage, canvas.width, canvas.height)
  context.restore()

  context.fillStyle = 'rgba(255, 255, 255, 0.08)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.save()
  context.globalAlpha = 0.3
  drawCoverImage(context, sourceImage, canvas.width, canvas.height)
  context.restore()

  return canvas
}

function buildCommunityFill(
  communityId: string,
  imageMap: Map<string, HTMLCanvasElement>,
  fallbackColor: string,
): string | EChartsPatternColor {
  const normalizedId = communityId.trim()
  if (!normalizedId) return fallbackColor
  const image = imageMap.get(normalizedId)
  if (!image) return fallbackColor

  return {
    image,
    repeat: 'no-repeat',
  }
}

function CommunityLegendRow({
  community,
  totalRewards,
  isActive,
  isPinned,
  onPreview,
  onPreviewEnd,
  onTogglePin,
}: {
  community: DashboardCommunityRewardBreakdown
  totalRewards: number
  isActive: boolean
  isPinned: boolean
  onPreview: () => void
  onPreviewEnd: () => void
  onTogglePin: () => void
}) {
  return (
    <Box
      as="button"
      w="full"
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      onClick={onTogglePin}
      aria-pressed={isPinned}
      aria-label={`${community.label}, ${formatPercent(
        community.totalRewards,
        totalRewards,
      )} of community rewards, ${formatTokenAmount(
        community.totalRewards,
        2,
      )} HBD`}
      textAlign="left"
      px={1.5}
      py={1.25}
      borderRadius="md"
      borderWidth="1px"
      borderColor={isActive ? 'border.emphasized' : 'transparent'}
      bg={isActive ? 'bg.subtle' : 'transparent'}
      opacity={isActive ? 1 : 0.74}
      transition="background 0.14s, opacity 0.14s, border-color 0.14s"
      _hover={{ opacity: 1 }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'border.emphasized',
        outlineOffset: '2px',
      }}
    >
      <HStack gap={2} justify="space-between">
        <HStack gap={2} minW={0}>
          <Image
            src={getHiveAvatarUrl(community.id, 'small')}
            alt={community.label}
            boxSize="18px"
            borderRadius="full"
            border="1.5px solid"
            borderColor={isActive ? 'border.emphasized' : 'border.subtle'}
            objectFit="cover"
            filter="grayscale(20%)"
            flexShrink={0}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <Text
            fontSize="xs"
            color={isActive ? 'fg' : 'fg.muted'}
            lineClamp={1}
            fontWeight={isActive ? '600' : '400'}
          >
            {community.label}
          </Text>
        </HStack>
        <Text
          fontSize="xs"
          fontFamily="mono"
          color={isActive ? 'fg' : 'fg.subtle'}
          fontWeight={isActive ? '600' : '400'}
          flexShrink={0}
        >
          {formatTokenAmount(community.totalRewards, 2)} HBD
        </Text>
      </HStack>
    </Box>
  )
}

export default function CommunityRewardBreakdownChart({
  communities,
}: CommunityRewardBreakdownChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)
  const [imageMap, setImageMap] = useState<Map<string, HTMLCanvasElement>>(
    () => new Map(),
  )
  const [hoveredCommunityId, setHoveredCommunityId] = useState<string | null>(null)
  const [pinnedCommunityId, setPinnedCommunityId] = useState<string | null>(null)
  const [showCommunityLabels, setShowCommunityLabels] = useState(true)

  const chartCommunities = useMemo(
    () => communities.filter((community) => community.totalRewards > 0),
    [communities],
  )
  const totalRewards = useMemo(
    () => chartCommunities.reduce((sum, community) => sum + community.totalRewards, 0),
    [chartCommunities],
  )
  const hasPinnedSelection = pinnedCommunityId != null
  const activeCommunityId = pinnedCommunityId ?? hoveredCommunityId

  const clearPreview = useCallback(() => {
    if (hasPinnedSelection) return
    setHoveredCommunityId(null)
  }, [hasPinnedSelection])

  const previewCommunity = useCallback(
    (communityId: string) => {
      if (hasPinnedSelection) return
      setHoveredCommunityId(communityId)
    },
    [hasPinnedSelection],
  )

  const clearPinnedSelection = useCallback(() => {
    setPinnedCommunityId(null)
  }, [])

  const togglePinnedCommunity = useCallback(
    (communityId: string) => {
      if (pinnedCommunityId === communityId) {
        clearPinnedSelection()
        return
      }

      setPinnedCommunityId(communityId)
      setHoveredCommunityId(null)
    },
    [clearPinnedSelection, pinnedCommunityId],
  )

  useEffect(() => {
    if (chartCommunities.length === 0 || typeof window === 'undefined') {
      setImageMap(new Map())
      return
    }

    let cancelled = false
    const nextImageMap = new Map<string, HTMLCanvasElement>()

    chartCommunities.forEach((community) => {
      const normalizedId = community.id.trim()
      if (!normalizedId) return

      const image = new window.Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        if (cancelled) return
        const texture = buildBlurredTexture(image)
        if (!texture) return
        nextImageMap.set(normalizedId, texture)
        setImageMap(new Map(nextImageMap))
      }
      image.src = getHiveAvatarUrl(normalizedId)
    })

    return () => {
      cancelled = true
    }
  }, [chartCommunities])

  useEffect(() => {
    const container = chartRef.current
    if (!container || chartCommunities.length === 0) return
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('jsdom')
    ) {
      return
    }

    const instance = echarts.init(container, undefined, { renderer: 'canvas' })
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
    const instance = instanceRef.current
    if (!instance) return

    const communityIdByLabel = new Map(
      chartCommunities.map((community) => [community.label, community.id.trim()]),
    )

    const getCommunityIdFromParams = (params: {
      name?: string
      treePathInfo?: Array<{ name?: string }>
    }) => {
      const treePath = params.treePathInfo ?? []
      const communityLabel = treePath[1]?.name ?? params.name
      return communityLabel ? communityIdByLabel.get(communityLabel) ?? null : null
    }

    const handleMouseover = (params: unknown) => {
      const communityId = getCommunityIdFromParams(
        params as { name?: string; treePathInfo?: Array<{ name?: string }> },
      )
      if (communityId) previewCommunity(communityId)
    }

    const handleGlobalOut = () => clearPreview()

    const handleClick = (params: unknown) => {
      const communityId = getCommunityIdFromParams(
        params as { name?: string; treePathInfo?: Array<{ name?: string }> },
      )
      if (communityId) togglePinnedCommunity(communityId)
    }

    const handleBackgroundClick = (event: { target?: unknown }) => {
      if (event.target != null || !hasPinnedSelection) return
      clearPinnedSelection()
    }

    instance.on('mouseover', handleMouseover)
    instance.on('globalout', handleGlobalOut)
    instance.on('click', handleClick)
    instance.getZr().on('click', handleBackgroundClick)

    return () => {
      instance.off('mouseover', handleMouseover)
      instance.off('globalout', handleGlobalOut)
      instance.off('click', handleClick)
      instance.getZr().off('click', handleBackgroundClick)
    }
  }, [
    chartCommunities,
    clearPinnedSelection,
    clearPreview,
    hasPinnedSelection,
    previewCommunity,
    togglePinnedCommunity,
  ])

  useEffect(() => {
    const container = chartRef.current
    const instance = instanceRef.current
    if (!container || !instance || chartCommunities.length === 0) return

    const color = (token: string) => resolveCssVar(token, container)
    const rootBorder = color(semanticVar('border.subtle'))
    const tileBorder = color(semanticVar('bg'))
    const tileFallback = color(semanticVar('bg.muted'))

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
          const communityId =
            chartCommunities.find(
              (community) => community.label === communityLabel,
            )?.id ?? ''
          const avatarUrl = communityId ? getHiveAvatarUrl(communityId, 'small') : ''

          return [
            `<div style="display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:6px;">${
              avatarUrl
                ? `<img src="${avatarUrl}" alt="" width="18" height="18" style="width:18px;height:18px;border-radius:999px;object-fit:cover;flex-shrink:0;" />`
                : ''
            }<span>${communityLabel}</span></div>`,
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
            show: showCommunityLabels,
            formatter: '{b}',
            color: color(semanticVar('fg')),
            fontSize: 12,
            overflow: 'truncate',
          },
          upperLabel: {
            show: showCommunityLabels,
            height: 22,
            color: color(semanticVar('fg')),
            fontSize: 12,
            fontWeight: 'bold',
          },
          emphasis: {
            disabled: true,
          },
          itemStyle: {
            borderColor: rootBorder,
            borderWidth: 2,
            gapWidth: 4,
            borderRadius: 14,
          },
          levels: [
            {
              itemStyle: {
                borderColor: rootBorder,
                borderWidth: 2,
                gapWidth: 4,
                borderRadius: 14,
              },
            },
            {
              itemStyle: {
                borderColor: tileBorder,
                borderWidth: 2,
                gapWidth: 3,
                borderRadius: 10,
              },
            },
          ],
          data: chartCommunities.map((community) => ({
            name: community.label,
            value: community.totalRewards,
            itemStyle: {
              color: buildCommunityFill(community.id, imageMap, tileFallback),
            },
            children: [
              ...(community.postRewards > 0
                ? [
                    {
                      name: 'Posts',
                      value: community.postRewards,
                      label: {
                        show: false,
                      },
                      itemStyle: {
                        color: buildCommunityFill(
                          community.id,
                          imageMap,
                          tileFallback,
                        ),
                        borderColor: tileBorder,
                        borderWidth: 2,
                        borderRadius: 10,
                      },
                    },
                  ]
                : []),
              ...(community.commentRewards > 0
                ? [
                    {
                      name: 'Comments',
                      value: community.commentRewards,
                      label: {
                        show: false,
                      },
                      itemStyle: {
                        color: buildCommunityFill(
                          community.id,
                          imageMap,
                          tileFallback,
                        ),
                        borderColor: tileBorder,
                        borderWidth: 2,
                        borderRadius: 10,
                      },
                    },
                  ]
                : []),
            ],
          })),
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [chartCommunities, imageMap, showCommunityLabels, totalRewards])

  if (chartCommunities.length === 0) {
    return null
  }

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={2} gap={3} wrap="wrap">
        <Checkbox.Root
          checked={showCommunityLabels}
          onCheckedChange={(event) => setShowCommunityLabels(!!event.checked)}
          size="sm"
          colorPalette="gray"
          variant="subtle"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label fontSize="xs" color="fg.muted">
            Show community labels
          </Checkbox.Label>
        </Checkbox.Root>
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
        ) : <Box />}
      </HStack>
      <Box ref={chartRef} h="18rem" w="full" />
      <Stack gap={1.5} mt={3}>
        {chartCommunities.slice(0, 6).map((community) => (
          <CommunityLegendRow
            key={community.id}
            community={community}
            totalRewards={totalRewards}
            isActive={activeCommunityId === community.id}
            isPinned={pinnedCommunityId === community.id}
            onPreview={() => previewCommunity(community.id)}
            onPreviewEnd={clearPreview}
            onTogglePin={() => togglePinnedCommunity(community.id)}
          />
        ))}
      </Stack>
    </Box>
  )
}
