import { Box, Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import type {
  DashboardIncomeBreakdownCategory,
  DashboardIncomeBreakdownCategoryId,
  DashboardIncomeBreakdownSubcategory,
  DashboardRange,
} from './types'

const RANGE_LABELS: Record<DashboardRange, string> = {
  '1M': 'Last month',
  '3M': 'Last 3 months',
  '6M': 'Last 6 months',
  '1Y': 'Last year',
}

const tokenVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

const semanticVar = (token: string) =>
  `var(--chakra-colors-${token.replace(/\./g, '-')})`

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

function CenterLabel({
  cx,
  cy,
  hovered,
  total,
  range,
}: {
  cx: number
  cy: number
  hovered: { label: string; value: number } | null
  total: number
  range: DashboardRange
}) {
  const lineHeight = 21

  if (hovered) {
    return (
      <g>
        <text
          x={cx}
          y={cy - lineHeight * 1.6}
          textAnchor="middle"
          fill={semanticVar('fg.muted')}
          fontSize="11"
          fontFamily="var(--chakra-fonts-mono)"
          letterSpacing="2"
        >
          {formatPercent(hovered.value, total)}
        </text>
        <text
          x={cx}
          y={cy - lineHeight * 0.35}
          textAnchor="middle"
          fill={semanticVar('fg')}
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--chakra-fonts-body)"
        >
          {formatHbd(hovered.value)}
        </text>
        <text
          x={cx}
          y={cy + lineHeight * 0.85}
          textAnchor="middle"
          fill={semanticVar('fg.muted')}
          fontSize="12"
          fontFamily="var(--chakra-fonts-body)"
        >
          HBD
        </text>
        <text
          x={cx}
          y={cy + lineHeight * 2}
          textAnchor="middle"
          fill={semanticVar('fg.subtle')}
          fontSize="11"
          fontFamily="var(--chakra-fonts-body)"
        >
          {hovered.label}
        </text>
      </g>
    )
  }

  return (
    <g>
      <text
        x={cx}
        y={cy - lineHeight * 1.3}
        textAnchor="middle"
        fill={semanticVar('fg.subtle')}
        fontSize="10"
        fontFamily="var(--chakra-fonts-mono)"
        letterSpacing="2"
      >
        TOTAL INCOME
      </text>
      <text
        x={cx}
        y={cy - lineHeight * 0.1}
        textAnchor="middle"
        fill={semanticVar('fg')}
        fontSize="24"
        fontWeight="700"
        fontFamily="var(--chakra-fonts-body)"
      >
        {formatHbd(total)}
      </text>
      <text
        x={cx}
        y={cy + lineHeight * 1.1}
        textAnchor="middle"
        fill={semanticVar('fg.muted')}
        fontSize="12"
        fontFamily="var(--chakra-fonts-body)"
      >
        HBD
      </text>
      <text
        x={cx}
        y={cy + lineHeight * 2.2}
        textAnchor="middle"
        fill={semanticVar('fg.subtle')}
        fontSize="10"
        fontFamily="var(--chakra-fonts-body)"
      >
        {RANGE_LABELS[range]}
      </text>
    </g>
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
  return (
    <Box
      as="button"
      type="button"
      w="full"
      colorPalette={palette}
      onMouseEnter={onPreview}
      onMouseLeave={onPreviewEnd}
      onFocus={onPreview}
      onBlur={onPreviewEnd}
      onClick={onTogglePin}
      aria-pressed={isPinned}
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

  const visibleCategories = categories
    .map((category) => {
      const subcategories = getVisibleSubcategories(category.subcategories)
      return {
        ...category,
        subcategories,
      }
    })
    .filter((category) => category.value > 0 && category.subcategories.length > 0)

  const chartCenterX = 140
  const chartCenterY = 140
  const totalHbd = visibleCategories.reduce(
    (total, category) => total + category.value,
    0,
  )
  const hasPinnedSelection =
    pinnedCategoryId != null || pinnedSubcategoryId != null
  const activeCategoryId = pinnedCategoryId ?? hoveredCategoryId
  const activeSubcategoryId = pinnedSubcategoryId ?? hoveredSubcategoryId

  const clearPreview = () => {
    if (hasPinnedSelection) return
    setHoveredCategoryId(null)
    setHoveredSubcategoryId(null)
  }

  const previewCategory = (categoryId: DashboardIncomeBreakdownCategoryId) => {
    if (hasPinnedSelection) return
    setHoveredCategoryId(categoryId)
    setHoveredSubcategoryId(null)
  }

  const previewSubcategory = (
    categoryId: DashboardIncomeBreakdownCategoryId,
    subcategoryId: string,
  ) => {
    if (hasPinnedSelection) return
    setHoveredCategoryId(categoryId)
    setHoveredSubcategoryId(subcategoryId)
  }

  const clearPinnedSelection = () => {
    setPinnedCategoryId(null)
    setPinnedSubcategoryId(null)
  }

  const togglePinnedCategory = (categoryId: DashboardIncomeBreakdownCategoryId) => {
    if (pinnedCategoryId === categoryId && pinnedSubcategoryId == null) {
      clearPinnedSelection()
      return
    }

    setPinnedCategoryId(categoryId)
    setPinnedSubcategoryId(null)
    setHoveredCategoryId(null)
    setHoveredSubcategoryId(null)
  }

  const togglePinnedSubcategory = (
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
  }

  const innerSlices: Array<CategorySlice> = visibleCategories.map((category) => ({
    id: category.id,
    label: category.label,
    value: category.value,
    colorToken: category.colorToken,
    palette: getPaletteName(category.colorToken),
  }))

  const outerSlices: Array<SubcategorySlice> = visibleCategories.flatMap(
    (category) =>
      category.subcategories.map((subcategory) => ({
        id: subcategory.id,
        label: subcategory.label,
        value: subcategory.value,
        colorToken: subcategory.colorToken,
        palette: getPaletteName(subcategory.colorToken),
        categoryId: category.id,
      })),
  )

  const activeOuterSlice = outerSlices.find(
    (slice) => slice.id === activeSubcategoryId,
  )

  const activeCenter = (() => {
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
  })()

  const renderOuterLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    percent,
  }: {
    cx?: number
    cy?: number
    midAngle?: number
    outerRadius?: number
    percent?: number
  }) => {
    if (
      cx == null ||
      cy == null ||
      midAngle == null ||
      outerRadius == null ||
      percent == null ||
      percent < 0.07
    ) {
      return null
    }

    const radians = Math.PI / 180
    const radius = outerRadius + 16
    const x = cx + radius * Math.cos(-midAngle * radians)
    const y = cy + radius * Math.sin(-midAngle * radians)

    return (
      <text
        x={x}
        y={y}
        fill={semanticVar('fg.subtle')}
        fontSize="9.5"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontFamily="var(--chakra-fonts-mono)"
      >
        {(percent * 100).toFixed(0)}%
      </text>
    )
  }

  return (
    <Stack gap={4} align="center" py={2}>
      <Box
        w="full"
        maxW="680px"
        bg="bg.panel"
        borderRadius="20px"
        borderWidth="1px"
        borderColor="border.subtle"
        px={{ base: 4, md: 6 }}
        py={7}
      >
        <Flex
          justify="space-between"
          align={{ base: 'start', sm: 'flex-start' }}
          mb={6}
          gap={3}
          wrap="wrap"
        >
          <Stack gap={0.5}>
            <Text fontSize="15px" fontWeight="600" letterSpacing="-0.01em">
              Income breakdown
            </Text>
            <Text
              fontSize="10px"
              color="fg.muted"
              fontFamily="mono"
              letterSpacing="0.1em"
              textTransform="uppercase"
            >
              {RANGE_LABELS[range]} · cash-like sources
            </Text>
          </Stack>

          <HStack gap={2} wrap="wrap" justify="end">
            {hasPinnedSelection ? (
              <Box
                as="button"
                type="button"
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
          <Box position="relative" w="280px" h="280px" flexShrink={0}>
            {visibleCategories.length > 0 ? (
              <PieChart width={280} height={280}>
                <Pie
                  data={innerSlices}
                  cx={chartCenterX}
                  cy={chartCenterY}
                  innerRadius={68}
                  outerRadius={104}
                  dataKey="value"
                  paddingAngle={2.5}
                  isAnimationActive={false}
                  onMouseEnter={(_, index) => {
                    const slice = innerSlices[index]
                    previewCategory(slice.id)
                  }}
                  onMouseLeave={clearPreview}
                  onClick={(_, index) => {
                    const slice = innerSlices[index]
                    togglePinnedCategory(slice.id)
                  }}
                >
                  {innerSlices.map((slice) => (
                    <Cell
                      key={slice.id}
                      fill={tokenVar(slice.colorToken)}
                      opacity={
                        activeCategoryId == null && activeSubcategoryId == null
                          ? 1
                          : activeCategoryId === slice.id ||
                              activeOuterSlice?.categoryId === slice.id
                            ? 1
                            : 0.2
                      }
                      stroke={
                        activeCategoryId === slice.id
                          ? semanticVar(`${slice.palette}.border`)
                          : 'transparent'
                      }
                      strokeWidth={2}
                      style={{ transition: 'opacity 0.18s', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>

                <Pie
                  data={outerSlices}
                  cx={chartCenterX}
                  cy={chartCenterY}
                  innerRadius={110}
                  outerRadius={132}
                  dataKey="value"
                  paddingAngle={1.5}
                  cornerRadius={3}
                  isAnimationActive={false}
                  onMouseEnter={(_, index) => {
                    const slice = outerSlices[index]
                    previewSubcategory(slice.categoryId, slice.id)
                  }}
                  onMouseLeave={clearPreview}
                  onClick={(_, index) => {
                    const slice = outerSlices[index]
                    togglePinnedSubcategory(slice.categoryId, slice.id)
                  }}
                  label={renderOuterLabel}
                  labelLine={false}
                >
                  {outerSlices.map((slice) => (
                    <Cell
                      key={slice.id}
                      fill={tokenVar(slice.colorToken)}
                      opacity={
                        activeCategoryId == null && activeSubcategoryId == null
                          ? 0.9
                          : activeSubcategoryId === slice.id
                            ? 1
                            : activeCategoryId === slice.categoryId
                              ? 0.72
                              : 0.14
                      }
                      stroke={
                        activeSubcategoryId === slice.id
                          ? semanticVar(`${slice.palette}.border`)
                          : 'transparent'
                      }
                      strokeWidth={1.5}
                      style={{ transition: 'opacity 0.18s', cursor: 'pointer' }}
                    />
                  ))}
                </Pie>

                <g>
                  <CenterLabel
                    cx={chartCenterX}
                    cy={chartCenterY}
                    hovered={activeCenter}
                    total={totalHbd}
                    range={range}
                  />
                </g>
              </PieChart>
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

            <Text px={1.5} pt={1} fontSize="11px" color="fg.muted">
              Percentages show share of total income for the selected range.
            </Text>

            <HStack
              justify="space-between"
              px={1.5}
              pt={2}
              mt={0.5}
              borderTopWidth="1px"
              borderTopColor="border.subtle"
            >
              <Text fontSize="12px" color="fg.muted">
                Total
              </Text>
              <Text
                fontSize="14px"
                fontWeight="600"
                color="fg"
                fontFamily="mono"
                letterSpacing="0.04em"
              >
                {formatHbd(totalHbd)} HBD
              </Text>
            </HStack>
          </Stack>
        </Flex>
      </Box>
    </Stack>
  )
}
