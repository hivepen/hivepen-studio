// @vitest-environment jsdom

import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
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
    label: 'Interest',
    value: 0.5,
    share: 0.05,
    colorToken: 'yellow.solid',
    subcategories: [
      {
        id: 'hbd_savings',
        parentId: 'interest',
        label: 'HBD Savings',
        value: 0.5,
        share: 0.05,
        colorToken: 'yellow.emphasized',
      },
    ],
  },
  {
    id: 'witness',
    label: 'Witness',
    value: 1,
    share: 0.1,
    colorToken: 'cyan.solid',
    subcategories: [
      {
        id: 'witness_blocks',
        parentId: 'witness',
        label: 'Block rewards',
        value: 1,
        share: 0.1,
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
        label: 'Delegation',
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
  it('renders the dashboard-owned range and hierarchical legend values', () => {
    render(
      <ChakraProvider value={chakraSystem}>
        <IncomeBreakdownChart range="3M" categories={categories} />
      </ChakraProvider>,
    )

    expect(screen.getByText('Income breakdown')).toBeTruthy()
    expect(screen.getAllByText(/Last 3 months/i)).toHaveLength(2)
    expect(screen.getByText('Post rewards')).toBeTruthy()
    expect(screen.getByText('Comment rewards')).toBeTruthy()
    expect(screen.getByText('Delegation')).toBeTruthy()
    expect(screen.getAllByText('13.50')).toHaveLength(2)
  })
})
