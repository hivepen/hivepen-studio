import { Box, Flex, HStack, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { SunburstChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsType } from 'echarts/core'
import type { SunburstSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type {
  DashboardIncomeBreakdownCategory,
  DashboardIncomeBreakdownCategoryId,
  DashboardIncomeBreakdownSubcategory,
  DashboardRange,
} from './types'

echarts.use([SunburstChart, TooltipComponent, SVGRenderer])

type IncomeBreakdownOption = {
  animation: boolean
  tooltip: TooltipComponentOption
  series: Array<SunburstSeriesOption>
}

type CategorySlice = {
  id: DashboardIncomeBreakdownCategoryId
  label: string
  value: number
  colorToken: string
  palette: string
}

type SubcategorySlice = {
  id: string
  label: string
  value: number
  colorToken: string
  palette: string
  categoryId: DashboardIncomeBreakdownCategoryId
}

const RANGE_LABELS: Record<DashboardRange, string> = {
  '1M': 'Last month',
  '3M': 'Last 3 months',
  '6M': 'Last 6 months',
  '1Y': 'Last year',
}

const CHART_WIDTH = 320
const CHART_HEIGHT = 300

const CAT_PREFIX = 'cat:'
const SUB_PREFIX = 'sub:'

const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

function catNodeName(id: string) {
  return `${CAT_PREFIX}${id}`
}

function subNodeName(id: string) {
  return `${SUB_PREFIX}${id}`
}

function parseCatId(name: string) {
  return name.startsWith(CAT_PREFIX) ? name.slice(CAT_PREFIX.length) : null
}

function parseSubId(name: string) {
  return name.startsWith(SUB_PREFIX) ? name.slice(SUB_PREFIX.length) : null
}

function formatHbd(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number, total: number) {
  if (total === 0) return '0.0%'
  return `${((value / total) * 100).toFixed(1)}%`
}

function getPaletteName(token: string) {
  return token.split('.')[0] ?? 'gray'
}

function getVisibleSubcategories(
  subcategories: Array<DashboardIncomeBreakdownSubcategory>,
) {
  return subcategories.filter((subcategory) => subcategory.value > 0)
}

function resolveCssVar(varExpr: string, element: HTMLElement) {
  const match = varExpr.match(/var\((--[^)]+)\)/)
  if (!match) return varExpr
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || '#888888'
}

function CenterLabel({
  hovered,
  total,
}: {
  hovered: { label: string; value: number } | null
  total: number
}) {
  if (hovered) {
    return (
      <Stack
        gap={0.5}
        textAlign="center"
        align="center"
        maxW="150px"
        pointerEvents="none"
      >
        <Text
          color="fg.muted"
          fontSize="11px"
          fontFamily="mono"
          letterSpacing="0.18em"
          textTransform="uppercase"
        >
          {formatPercent(hovered.value, total)}
        </Text>
        <Text color="fg" fontSize="22px" fontWeight="700" lineHeight="1">
          {formatHbd(hovered.value)}
        </Text>
        <Text color="fg.muted" fontSize="12px" lineHeight="1">
          HBD
        </Text>
        <Text color="fg.subtle" fontSize="11px" lineHeight="1.2">
          {hovered.label}
        </Text>
      </Stack>
    )
  }

  return (
    <Stack gap={1} textAlign="center" align="center" pointerEvents="none">
      <Text color="fg" fontSize="24px" fontWeight="700" lineHeight="1">
        {formatHbd(total)}
      </Text>
      <Text color="fg.muted" fontSize="12px" lineHeight="1">
        HBD
      </Text>
    </Stack>
  )
}

function LegendRow({
  colorToken,
  palette,
  label,
  value,
  total,
  isActive,
  isPinned,
  isChild,
  onPreview,
  onPreviewEnd,
  onTogglePin,
}: {
  colorToken: string
  palette: string
  label: string
  value: number
  total: number
  isActive: boolean
  isPinned: boolean
  isChild: boolean
  onPreview: () => void
  onPreviewEnd: () => void
  onTogglePin: () => void
}) {
  const summaryLabel = `${label}, ${formatPercent(value, total)} of total income, ${formatHbd(value)} HBD`

  return (
    <Box
      as="button"
      w="full"
      colorPalette={palette}
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      onClick={onTogglePin}
      aria-pressed={isPinned}
      aria-label={summaryLabel}
      textAlign="left"
      px={1.5}
      py={isChild ? 0.75 : 1.25}
      ps={isChild ? 5.5 : 1.5}
      borderRadius="md"
      borderWidth="1px"
      borderColor={isActive ? 'colorPalette.border' : 'transparent'}
      bg={isActive ? 'colorPalette.subtle' : 'transparent'}
      opacity={isActive ? 1 : 0.72}
      transition="background 0.14s, opacity 0.14s, border-color 0.14s"
      _hover={{ opacity: 1 }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'colorPalette.focusRing',
        outlineOffset: '2px',
      }}
    >
      <HStack gap={2}>
        <Box
          boxSize={isChild ? '7px' : '10px'}
          borderRadius={isChild ? '2px' : '3px'}
          bg={tokenVar(colorToken)}
          flexShrink={0}
        />
        <Text
          flex="1"
          minW={0}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          fontSize={isChild ? '12px' : '13px'}
          color={isActive ? 'colorPalette.fg' : 'fg'}
          fontWeight={isChild ? '400' : '500'}
        >
          {label}
        </Text>
        <Text fontSize="11px" color="fg.muted" fontFamily="mono" flexShrink={0}>
          {formatPercent(value, total)}
        </Text>
        <Text
          minW="62px"
          textAlign="right"
          fontSize="12px"
          color={isActive ? 'colorPalette.fg' : 'fg.subtle'}
          fontFamily="mono"
          fontWeight={isActive ? '600' : '400'}
          flexShrink={0}
        >
          {formatHbd(value)}
        </Text>
      </HStack>
    </Box>
  )
}

export default function IncomeBreakdownChart({
  range,
  categories,
}: {
  range: DashboardRange
  categories: Array<DashboardIncomeBreakdownCategory>
}) {
  const chartRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<EChartsType | null>(null)
  const [hoveredCategoryId, setHoveredCategoryId] =
    useState<DashboardIncomeBreakdownCategoryId | null>(null)
  const [hoveredSubcategoryId, setHoveredSubcategoryId] = useState<
    string | null
  >(null)
  const [pinnedCategoryId, setPinnedCategoryId] =
    useState<DashboardIncomeBreakdownCategoryId | null>(null)
  const [pinnedSubcategoryId, setPinnedSubcategoryId] = useState<string | null>(
    null,
  )
  const chartInstructionId = 'income-breakdown-chart-instructions'
  const chartSummaryId = 'income-breakdown-chart-summary'
  const chartTitleId = 'income-breakdown-chart-body-title'

  const visibleCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          subcategories: getVisibleSubcategories(category.subcategories),
        }))
        .filter(
          (category) => category.value > 0 && category.subcategories.length > 0,
        ),
    [categories],
  )

  const totalHbd = useMemo(
    () =>
      visibleCategories.reduce((total, category) => total + category.value, 0),
    [visibleCategories],
  )

  const hasPinnedSelection =
    pinnedCategoryId != null || pinnedSubcategoryId != null
  const activeCategoryId = pinnedCategoryId ?? hoveredCategoryId
  const activeSubcategoryId = pinnedSubcategoryId ?? hoveredSubcategoryId

  const clearPreview = useCallback(() => {
    if (hasPinnedSelection) return
    setHoveredCategoryId(null)
    setHoveredSubcategoryId(null)
  }, [hasPinnedSelection])

  const previewCategory = useCallback(
    (categoryId: DashboardIncomeBreakdownCategoryId) => {
      if (hasPinnedSelection) return
      setHoveredCategoryId(categoryId)
      setHoveredSubcategoryId(null)
    },
    [hasPinnedSelection],
  )

  const previewSubcategory = useCallback(
    (
      categoryId: DashboardIncomeBreakdownCategoryId,
      subcategoryId: string,
    ) => {
      if (hasPinnedSelection) return
      setHoveredCategoryId(categoryId)
      setHoveredSubcategoryId(subcategoryId)
    },
    [hasPinnedSelection],
  )

  const clearPinnedSelection = useCallback(() => {
    setPinnedCategoryId(null)
    setPinnedSubcategoryId(null)
  }, [])

  const togglePinnedCategory = useCallback(
    (categoryId: DashboardIncomeBreakdownCategoryId) => {
      if (pinnedCategoryId === categoryId && pinnedSubcategoryId == null) {
        clearPinnedSelection()
        return
      }

      setPinnedCategoryId(categoryId)
      setPinnedSubcategoryId(null)
      setHoveredCategoryId(null)
      setHoveredSubcategoryId(null)
    },
    [clearPinnedSelection, pinnedCategoryId, pinnedSubcategoryId],
  )

  const togglePinnedSubcategory = useCallback(
    (
      categoryId: DashboardIncomeBreakdownCategoryId,
      subcategoryId: string,
    ) => {
      if (
        pinnedCategoryId === categoryId &&
        pinnedSubcategoryId === subcategoryId
      ) {
        clearPinnedSelection()
        return
      }

      setPinnedCategoryId(categoryId)
      setPinnedSubcategoryId(subcategoryId)
      setHoveredCategoryId(null)
      setHoveredSubcategoryId(null)
    },
    [clearPinnedSelection, pinnedCategoryId, pinnedSubcategoryId],
  )

  const innerSlices: Array<CategorySlice> = useMemo(
    () =>
      visibleCategories.map((category) => ({
        id: category.id,
        label: category.label,
        value: category.value,
        colorToken: category.colorToken,
        palette: getPaletteName(category.colorToken),
      })),
    [visibleCategories],
  )

  const outerSlices: Array<SubcategorySlice> = useMemo(
    () =>
      visibleCategories.flatMap((category) =>
        category.subcategories.map((subcategory) => ({
          id: subcategory.id,
          label: subcategory.label,
          value: subcategory.value,
          colorToken: subcategory.colorToken,
          palette: getPaletteName(subcategory.colorToken),
          categoryId: category.id,
        })),
      ),
    [visibleCategories],
  )

  const activeCenter = useMemo(() => {
    if (activeSubcategoryId) {
      const subcategory = outerSlices.find(
        (slice) => slice.id === activeSubcategoryId,
      )

      if (subcategory) {
        return { label: subcategory.label, value: subcategory.value }
      }
    }

    if (activeCategoryId) {
      const category = visibleCategories.find((entry) => entry.id === activeCategoryId)

      if (category) {
        return { label: category.label, value: category.value }
      }
    }

    return null
  }, [activeCategoryId, activeSubcategoryId, outerSlices, visibleCategories])

  useEffect(() => {
    const container = chartRef.current
    if (!container || visibleCategories.length === 0) return
    if (
      typeof navigator !== 'undefined' &&
      navigator.userAgent.toLowerCase().includes('jsdom')
    ) {
      return
    }

    const instance = echarts.init(container, undefined, { renderer: 'svg' })
    instanceRef.current = instance

    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(() => instance.resize())
      observer.observe(container)

      return () => {
        observer.disconnect()
        instance.dispose()
        instanceRef.current = null
      }
    }

    return () => {
      instance.dispose()
      instanceRef.current = null
    }
  }, [visibleCategories.length])

  useEffect(() => {
    const instance = instanceRef.current
    if (!instance) return

    const resolveIds = (
      params: unknown,
    ): { catId: string | null; subId: string | null } => {
      const payload = params as {
        data?: { name?: string }
        treePathInfo?: Array<{ name?: string }>
      }
      const name = payload.data?.name ?? ''
      const subId = parseSubId(name)
      const catId = parseCatId(name)

      if (subId) {
        const parentName =
          payload.treePathInfo?.[payload.treePathInfo.length - 2]?.name ?? ''
        return { catId: parseCatId(parentName), subId }
      }

      return { catId, subId: null }
    }

    const handleMouseover = (params: unknown) => {
      const { catId, subId } = resolveIds(params)

      if (subId && catId) {
        previewSubcategory(catId as DashboardIncomeBreakdownCategoryId, subId)
      } else if (catId) {
        previewCategory(catId as DashboardIncomeBreakdownCategoryId)
      }
    }

    const handleGlobalOut = () => clearPreview()

    const handleClick = (params: unknown) => {
      const { catId, subId } = resolveIds(params)

      if (subId && catId) {
        togglePinnedSubcategory(catId as DashboardIncomeBreakdownCategoryId, subId)
      } else if (catId) {
        togglePinnedCategory(catId as DashboardIncomeBreakdownCategoryId)
      }
    }

    instance.on('mouseover', handleMouseover)
    instance.on('globalout', handleGlobalOut)
    instance.on('click', handleClick)

    return () => {
      instance.off('mouseover', handleMouseover)
      instance.off('globalout', handleGlobalOut)
      instance.off('click', handleClick)
    }
  }, [
    clearPreview,
    previewCategory,
    previewSubcategory,
    togglePinnedCategory,
    togglePinnedSubcategory,
  ])

  useEffect(() => {
    const instance = instanceRef.current
    const container = chartRef.current
    if (!instance || !container || visibleCategories.length === 0) return

    const resolveColor = (token: string) =>
      resolveCssVar(token, container)
    const surfaceColor = resolveColor(semanticVar('bg'))

    const nothingActive =
      activeCategoryId == null && activeSubcategoryId == null

    const sunburstData = visibleCategories.map((category) => {
      const categoryIsActive = activeCategoryId === category.id
      const categoryHasActiveChild = category.subcategories.some(
        (subcategory) => subcategory.id === activeSubcategoryId,
      )

      return {
        name: catNodeName(category.id),
        value: category.value,
        itemStyle: {
          color: resolveColor(tokenVar(category.colorToken)),
          opacity:
            nothingActive || categoryIsActive || categoryHasActiveChild ? 1 : 0.2,
          borderRadius: 7,
          borderWidth: categoryIsActive ? 3 : 2.5,
          borderColor: categoryIsActive
            ? resolveColor(
                semanticVar(`${getPaletteName(category.colorToken)}.border`),
              )
            : surfaceColor,
        },
        label: { show: false },
        emphasis: { disabled: true },
        children: category.subcategories.map((subcategory) => {
          const subcategoryIsActive = activeSubcategoryId === subcategory.id
          const percent = subcategory.value / totalHbd

          return {
            name: subNodeName(subcategory.id),
            value: subcategory.value,
            itemStyle: {
              color: resolveColor(tokenVar(subcategory.colorToken)),
              opacity: nothingActive
                ? 0.9
                : subcategoryIsActive
                  ? 1
                  : categoryIsActive
                    ? 0.72
                    : 0.14,
              borderRadius: 4,
              borderWidth: subcategoryIsActive ? 2.25 : 1.5,
              borderColor: subcategoryIsActive
                ? resolveColor(
                    semanticVar(`${getPaletteName(subcategory.colorToken)}.border`),
                  )
                : surfaceColor,
            },
            label:
              percent >= 0.07
                ? {
                    show: true,
                    position: 'outside' as const,
                    formatter: `${(percent * 100).toFixed(0)}%`,
                    fontSize: 9.5,
                    fontFamily: 'var(--chakra-fonts-mono)',
                    color: resolveColor(semanticVar('fg.subtle')),
                  }
                : { show: false },
            emphasis: { disabled: true },
          }
        }),
      }
    })

    const option: IncomeBreakdownOption = {
      animation: false,
      tooltip: {
        show: true,
        borderWidth: 1,
        backgroundColor: resolveColor(semanticVar('bg.panel')),
        borderColor: resolveColor(semanticVar('border.subtle')),
        textStyle: {
          color: resolveColor(semanticVar('fg')),
          fontFamily: 'var(--chakra-fonts-body)',
        },
        formatter: (params) => {
          const payload = params as { data?: { name?: string; value?: number } }
          const name = payload.data?.name ?? ''
          const value = Number(payload.data?.value ?? 0)
          const label =
            outerSlices.find((slice) => subNodeName(slice.id) === name)?.label ??
            innerSlices.find((slice) => catNodeName(slice.id) === name)?.label ??
            ''

          return `${label}<br/>${formatHbd(value)} HBD · ${formatPercent(value, totalHbd)}`
        },
      },
      series: [
        {
          type: 'sunburst',
          data: sunburstData,
          radius: [60, '90%'],
          center: ['50%', '49.5%'],
          nodeClick: false,
          sort: undefined,
          label: {
            rotate: 0,
          },
          itemStyle: {
            borderRadius: 7,
            borderWidth: 0,
          },
          levels: [
            {},
            {
              r0: 68,
              r: 104,
              label: { show: false },
            },
            {
              r0: 110,
              r: 132,
              label: {
                minAngle: 8,
              },
            },
          ],
          emphasis: {
            disabled: true,
          },
        },
      ],
    }

    instance.setOption(option, { notMerge: true })
    instance.resize()
  }, [
    activeCategoryId,
    activeSubcategoryId,
    innerSlices,
    outerSlices,
    totalHbd,
    visibleCategories,
  ])

  return (
    <Stack
      gap={5}
      role="group"
      aria-labelledby={chartTitleId}
      aria-describedby={`${chartInstructionId} ${chartSummaryId}`}
    >
      <VisuallyHidden id={chartTitleId}>Income breakdown chart</VisuallyHidden>
      <VisuallyHidden id={chartInstructionId}>
        Hover or focus rows to preview values. Click a row to pin it, then use
        the clear pin action to reset the chart.
      </VisuallyHidden>
      <VisuallyHidden id={chartSummaryId}>
        {visibleCategories.length > 0
          ? `Total cash-like income for ${RANGE_LABELS[range]} is ${formatHbd(totalHbd)} HBD across ${visibleCategories.length} visible categories.`
          : `No cash-like income is available for ${RANGE_LABELS[range]}.`}
      </VisuallyHidden>

      <Flex justify="flex-end" align={{ base: 'start', sm: 'center' }} gap={3} wrap="wrap">
        <HStack gap={2} wrap="wrap" justify="end">
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
          ) : null}
          <Box
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="8px"
            px={3}
            py={1}
            fontSize="13px"
            color="fg.muted"
            fontFamily="mono"
          >
            {formatHbd(totalHbd)} <Text as="span" color="fg.subtle">HBD</Text>
          </Box>
        </HStack>
      </Flex>

      <Flex direction={{ base: 'column', md: 'row' }} gap={5} align="center">
        <Box
          position="relative"
          w={`${CHART_WIDTH}px`}
          h={`${CHART_HEIGHT}px`}
          flexShrink={0}
          overflow="visible"
        >
          {visibleCategories.length > 0 ? (
            <>
              <Box ref={chartRef} w="full" h="full" />
              <Flex
                position="absolute"
                inset="0"
                align="center"
                justify="center"
                pointerEvents="none"
                px={12}
              >
                <CenterLabel hovered={activeCenter} total={totalHbd} />
              </Flex>
            </>
          ) : (
            <Flex
              h="full"
              align="center"
              justify="center"
              borderRadius="full"
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.subtle"
              textAlign="center"
              px={8}
            >
              <Stack gap={1.5}>
                <Text fontSize="sm" fontWeight="600">
                  No cash-like income yet
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {RANGE_LABELS[range]} does not include HBD or HIVE transfers,
                  author rewards, curation rewards, savings interest, or witness rewards.
                </Text>
              </Stack>
            </Flex>
          )}
        </Box>

        <Stack flex="1 1 180px" minW={0} gap={0.5} w="full">
          {visibleCategories.map((category) => {
            const categoryIsActive = activeCategoryId === category.id
            const categoryPalette = getPaletteName(category.colorToken)

            return (
              <Box key={category.id}>
                <LegendRow
                  colorToken={category.colorToken}
                  palette={categoryPalette}
                  label={category.label}
                  value={category.value}
                  total={totalHbd}
                  isActive={categoryIsActive}
                  isPinned={
                    pinnedCategoryId === category.id &&
                    pinnedSubcategoryId == null
                  }
                  isChild={false}
                  onPreview={() => previewCategory(category.id)}
                  onPreviewEnd={clearPreview}
                  onTogglePin={() => togglePinnedCategory(category.id)}
                />
                {category.subcategories.map((subcategory) => (
                  <LegendRow
                    key={subcategory.id}
                    colorToken={subcategory.colorToken}
                    palette={getPaletteName(subcategory.colorToken)}
                    label={subcategory.label}
                    value={subcategory.value}
                    total={totalHbd}
                    isActive={
                      activeSubcategoryId === subcategory.id || categoryIsActive
                    }
                    isPinned={pinnedSubcategoryId === subcategory.id}
                    isChild
                    onPreview={() =>
                      previewSubcategory(category.id, subcategory.id)
                    }
                    onPreviewEnd={clearPreview}
                    onTogglePin={() =>
                      togglePinnedSubcategory(category.id, subcategory.id)
                    }
                  />
                ))}
                <Box h="1px" bg="border.subtle" mx={1.5} my={1} />
              </Box>
            )
          })}
        </Stack>
      </Flex>
    </Stack>
  )
}
