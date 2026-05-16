// @vitest-environment jsdom

import { ChakraProvider } from '@chakra-ui/react'
import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IncomeBreakdownChart from './IncomeBreakdownChart'
import chakraSystem from '@/theme'
import type { DashboardIncomeBreakdownCategory } from './types'

const categories: Array<DashboardIncomeBreakdownCategory> = [
  {
    id: 'author',
    label: 'Author',
    value: 7.5,
    share: 0.5,
    colorToken: 'green.solid',
    subcategories: [
      {
        id: 'post_rewards',
        parentId: 'author',
        label: 'Post rewards',
        value: 6,
        share: 0.4,
        colorToken: 'green.emphasized',
      },
      {
        id: 'comment_rewards',
        parentId: 'author',
        label: 'Comment rewards',
        value: 1.5,
        share: 0.1,
        colorToken: 'green.subtle',
      },
    ],
  },
  {
    id: 'curation',
    label: 'Curation',
    value: 1,
    share: 0.1,
    colorToken: 'purple.solid',
    subcategories: [
      {
        id: 'curation_votes',
        parentId: 'curation',
        label: 'Vote curation',
        value: 1,
        share: 0.1,
        colorToken: 'purple.emphasized',
      },
    ],
  },
  {
    id: 'interest',
    label: 'HBD savings',
    value: 0.5,
    share: 0.05,
    colorToken: 'orange.solid',
    subcategories: [
      {
        id: 'hbd_savings',
        parentId: 'interest',
        label: 'HBD interest',
        value: 0.5,
        share: 0.05,
        colorToken: 'orange.emphasized',
      },
    ],
  },
  {
    id: 'witness',
    label: 'Witness',
    value: 0,
    share: 0,
    colorToken: 'cyan.solid',
    subcategories: [
      {
        id: 'witness_blocks',
        parentId: 'witness',
        label: 'Block rewards',
        value: 0,
        share: 0,
        colorToken: 'cyan.emphasized',
      },
    ],
  },
  {
    id: 'transfers',
    label: 'Transfers',
    value: 3.5,
    share: 0.25,
    colorToken: 'red.solid',
    subcategories: [
      {
        id: 'delegation_income',
        parentId: 'transfers',
        label: 'From delegatees',
        value: 2,
        share: 0.15,
        colorToken: 'red.emphasized',
      },
      {
        id: 'other_transfers',
        parentId: 'transfers',
        label: 'Other transfers',
        value: 1.5,
        share: 0.1,
        colorToken: 'red.subtle',
      },
    ],
  },
]

describe('IncomeBreakdownChart', () => {
  it('renders the chart body metadata and hides empty categories', () => {
    render(
      <ChakraProvider value={chakraSystem}>
        <IncomeBreakdownChart range="3M" categories={categories} />
      </ChakraProvider>,
    )

    expect(screen.getByText('Post rewards')).toBeTruthy()
    expect(screen.queryByText('Witness')).toBeNull()
    expect(screen.getAllByText('12.50')).toHaveLength(2)
  })

  it('renders an explicit empty state when every category is zero', () => {
    cleanup()

    render(
      <ChakraProvider value={chakraSystem}>
        <IncomeBreakdownChart
          range="1M"
          categories={categories.map((category) => ({
            ...category,
            value: 0,
            subcategories: category.subcategories.map((subcategory) => ({
              ...subcategory,
              value: 0,
              share: 0,
            })),
          }))}
        />
      </ChakraProvider>,
    )

    expect(screen.getByText('No cash-like income yet')).toBeTruthy()
    expect(
      screen.getByText(
        /Last month does not include HBD or HIVE transfers, author rewards, curation rewards, savings interest, or witness rewards\./i,
      ),
    ).toBeTruthy()
    expect(
      screen.getByRole('group', { name: 'Income breakdown chart' }),
    ).toBeTruthy()
    expect(
      screen.getByText('No cash-like income is available for Last month.'),
    ).toBeTruthy()
  })
})
