import { Box, Flex, HStack, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import type {
  DashboardIncomeBreakdownCategory,
  DashboardIncomeBreakdownCategoryId,
  DashboardRange,
} from './types'

const PALETTE = {
  author: ['#22c55e', '#16a34a', '#4ade80'],
  curation: ['#a855f7', '#9333ea', '#c084fc'],
  interest: ['#f59e0b', '#d97706', '#fbbf24'],
  witness: ['#06b6d4', '#0891b2', '#22d3ee'],
  transfers: ['#f43f5e', '#e11d48', '#fb7185'],
} as const

const RANGE_LABELS: Record<DashboardRange, string> = {
  '1M': 'Last month',
  '3M': 'Last 3 months',
  '6M': 'Last 6 months',
  '1Y': 'Last year',
}

type CategorySlice = {
  id: string
  label: string
  value: number
  color: string
  categoryId: DashboardIncomeBreakdownCategoryId
}

type SubcategorySlice = CategorySlice

function getCategoryColor(id: DashboardIncomeBreakdownCategoryId, index = 0) {
  return PALETTE[id]?.[index] ?? '#6b7280'
}

function getSubColor(id: DashboardIncomeBreakdownCategoryId, index: number) {
  const palette = PALETTE[id]
  return palette?.[index % palette.length] ?? '#9ca3af'
}

function formatHbd(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number, total: number) {
  if (total === 0) return '0%'
  return `${((value / total) * 100).toFixed(1)}%`
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
          fill="#64748b"
          fontSize="11"
          fontFamily="monospace"
          letterSpacing="2"
        >
          {formatPercent(hovered.value, total)}
        </text>
        <text
          x={cx}
          y={cy - lineHeight * 0.35}
          textAnchor="middle"
          fill="#f1f5f9"
          fontSize="22"
          fontWeight="700"
          fontFamily="system-ui"
        >
          {formatHbd(hovered.value)}
        </text>
        <text
          x={cx}
          y={cy + lineHeight * 0.85}
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontFamily="system-ui"
        >
          HBD
        </text>
        <text
          x={cx}
          y={cy + lineHeight * 2}
          textAnchor="middle"
          fill="#475569"
          fontSize="11"
          fontFamily="system-ui"
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
        fill="#334155"
        fontSize="10"
        fontFamily="monospace"
        letterSpacing="2"
      >
        TOTAL INCOME
      </text>
      <text
        x={cx}
        y={cy - lineHeight * 0.1}
        textAnchor="middle"
        fill="#f1f5f9"
        fontSize="24"
        fontWeight="700"
        fontFamily="system-ui"
      >
        {formatHbd(total)}
      </text>
      <text
        x={cx}
        y={cy + lineHeight * 1.1}
        textAnchor="middle"
        fill="#64748b"
        fontSize="12"
        fontFamily="system-ui"
      >
        HBD
      </text>
      <text
        x={cx}
        y={cy + lineHeight * 2.2}
        textAnchor="middle"
        fill="#334155"
        fontSize="10"
        fontFamily="system-ui"
      >
        {RANGE_LABELS[range]}
      </text>
    </g>
  )
}

function LegendRow({
  color,
  label,
  value,
  total,
  isActive,
  isChild,
  onEnter,
  onLeave,
}: {
  color: string
  label: string
  value: number
  total: number
  isActive: boolean
  isChild: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'

  return (
    <HStack
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      gap={2}
      px={1.5}
      py={isChild ? 0.75 : 1.25}
      ps={isChild ? 5.5 : 1.5}
      borderRadius="7px"
      bg={isActive ? 'rgba(255,255,255,0.055)' : 'transparent'}
      opacity={isActive ? 1 : 0.55}
      transition="background 0.14s, opacity 0.14s"
      cursor="default"
      userSelect="none"
    >
      <Box
        boxSize={isChild ? '7px' : '10px'}
        borderRadius={isChild ? '2px' : '3px'}
        bg={color}
        flexShrink={0}
      />
      <Text
        flex="1"
        minW={0}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        fontSize={isChild ? '12px' : '13px'}
        color={isActive ? '#e2e8f0' : '#94a3b8'}
        fontWeight={isChild ? '400' : '500'}
      >
        {label}
      </Text>
      <Text
        fontSize="11px"
        color="#475569"
        fontFamily="mono"
        flexShrink={0}
      >
        {percent}%
      </Text>
      <Text
        minW="62px"
        textAlign="right"
        fontSize="12px"
        color={isActive ? color : '#334155'}
        fontFamily="mono"
        fontWeight={isActive ? '600' : '400'}
        flexShrink={0}
        transition="color 0.14s"
      >
        {formatHbd(value)}
      </Text>
    </HStack>
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

  const chartCenterX = 140
  const chartCenterY = 140
  const totalHbd = categories.reduce((total, category) => total + category.value, 0)

  const innerSlices: Array<CategorySlice> = categories.map((category) => ({
    id: category.id,
    label: category.label,
    value: category.value,
    color: getCategoryColor(category.id),
    categoryId: category.id,
  }))

  const outerSlices: Array<SubcategorySlice> = categories.flatMap((category) => {
    const subcategories = category.subcategories

    if (subcategories.length > 1) {
      return subcategories.map((subcategory, index) => ({
        id: subcategory.id,
        label: subcategory.label,
        value: subcategory.value,
        color: getSubColor(category.id, index + 1),
        categoryId: category.id,
      }))
    }

    const subcategory = subcategories[0]
    return [
      {
        id: subcategory?.id ?? `${category.id}_outer`,
        label: subcategory?.label ?? category.label,
        value: subcategory?.value ?? category.value,
        color: getSubColor(category.id, 1),
        categoryId: category.id,
      },
    ]
  })

  const hoveredOuterSlice = outerSlices.find(
    (slice) => slice.id === hoveredSubcategoryId,
  )

  const hoveredCenter = (() => {
    if (hoveredSubcategoryId) {
      const subcategory = outerSlices.find(
        (slice) => slice.id === hoveredSubcategoryId,
      )
      if (subcategory) {
        return { label: subcategory.label, value: subcategory.value }
      }
    }

    if (hoveredCategoryId) {
      const category = categories.find((entry) => entry.id === hoveredCategoryId)
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
        fill="#334155"
        fontSize="9.5"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontFamily="monospace"
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
        bg="#0f172a"
        borderRadius="20px"
        border="1px solid rgba(255,255,255,0.07)"
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
            <Text
              fontSize="15px"
              fontWeight="600"
              letterSpacing="-0.01em"
              color="#f1f5f9"
            >
              Income breakdown
            </Text>
            <Text
              fontSize="10px"
              color="#334155"
              fontFamily="mono"
              letterSpacing="0.1em"
              textTransform="uppercase"
            >
              {RANGE_LABELS[range]} · all sources
            </Text>
          </Stack>

          <Box
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.07)"
            borderRadius="8px"
            px={3}
            py={1}
            fontSize="13px"
            color="#64748b"
            fontFamily="mono"
          >
            {formatHbd(totalHbd)} <Text as="span" color="#334155">HBD</Text>
          </Box>
        </Flex>

        <Flex direction={{ base: 'column', md: 'row' }} gap={5} align="center">
          <Box position="relative" w="280px" h="280px" flexShrink={0}>
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
                  setHoveredCategoryId(innerSlices[index].categoryId)
                  setHoveredSubcategoryId(null)
                }}
                onMouseLeave={() => {
                  setHoveredCategoryId(null)
                }}
              >
                {innerSlices.map((slice) => (
                  <Cell
                    key={slice.id}
                    fill={slice.color}
                    opacity={
                      hoveredCategoryId == null && hoveredSubcategoryId == null
                        ? 1
                        : hoveredCategoryId === slice.categoryId ||
                            hoveredOuterSlice?.categoryId === slice.categoryId
                          ? 1
                          : 0.2
                    }
                    stroke={
                      hoveredCategoryId === slice.categoryId
                        ? 'rgba(255,255,255,0.2)'
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
                  setHoveredSubcategoryId(slice.id)
                  setHoveredCategoryId(slice.categoryId)
                }}
                onMouseLeave={() => {
                  setHoveredSubcategoryId(null)
                  setHoveredCategoryId(null)
                }}
                label={renderOuterLabel}
                labelLine={false}
              >
                {outerSlices.map((slice) => (
                  <Cell
                    key={slice.id}
                    fill={slice.color}
                    opacity={
                      hoveredCategoryId == null && hoveredSubcategoryId == null
                        ? 0.82
                        : hoveredSubcategoryId === slice.id
                          ? 1
                          : hoveredCategoryId === slice.categoryId
                            ? 0.7
                            : 0.15
                    }
                    stroke={
                      hoveredSubcategoryId === slice.id
                        ? 'rgba(255,255,255,0.25)'
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
                  hovered={hoveredCenter}
                  total={totalHbd}
                  range={range}
                />
              </g>
            </PieChart>

          </Box>

          <Stack flex="1 1 180px" minW={0} gap={0.5} w="full">
            {categories.map((category) => {
              const categoryIsActive = hoveredCategoryId === category.id
              const hasMultipleSubcategories = category.subcategories.length > 1

              return (
                <Box key={category.id}>
                  <LegendRow
                    color={getCategoryColor(category.id)}
                    label={category.label}
                    value={category.value}
                    total={totalHbd}
                    isActive={categoryIsActive}
                    isChild={false}
                    onEnter={() => {
                      setHoveredCategoryId(category.id)
                      setHoveredSubcategoryId(null)
                    }}
                    onLeave={() => {
                      setHoveredCategoryId(null)
                      setHoveredSubcategoryId(null)
                    }}
                  />
                  {hasMultipleSubcategories
                    ? category.subcategories.map((subcategory, index) => (
                        <LegendRow
                          key={subcategory.id}
                          color={getSubColor(category.id, index + 1)}
                          label={subcategory.label}
                          value={subcategory.value}
                          total={totalHbd}
                          isActive={
                            hoveredSubcategoryId === subcategory.id ||
                            categoryIsActive
                          }
                          isChild
                          onEnter={() => {
                            setHoveredSubcategoryId(subcategory.id)
                            setHoveredCategoryId(category.id)
                          }}
                          onLeave={() => {
                            setHoveredSubcategoryId(null)
                            setHoveredCategoryId(null)
                          }}
                        />
                      ))
                    : null}
                  <Box h="1px" bg="rgba(255,255,255,0.04)" mx={1.5} my={1} />
                </Box>
              )
            })}

            <HStack
              justify="space-between"
              px={1.5}
              pt={2}
              mt={0.5}
              borderTop="1px solid rgba(255,255,255,0.06)"
            >
              <Text fontSize="12px" color="#475569">
                Total
              </Text>
              <Text
                fontSize="14px"
                fontWeight="600"
                color="#e2e8f0"
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
