export const DASHBOARD_INCOME_PALETTE = {
  author: {
    colorToken: 'green.solid',
    palette: 'green',
    label: 'Author',
  },
  curation: {
    colorToken: 'purple.solid',
    palette: 'purple',
    label: 'Curation',
  },
  interest: {
    colorToken: 'orange.solid',
    palette: 'orange',
    label: 'Interest',
  },
  witness: {
    colorToken: 'cyan.solid',
    palette: 'cyan',
    label: 'Witness',
  },
  transfers: {
    colorToken: 'red.solid',
    palette: 'red',
    label: 'Transfers',
  },
} as const

export const DASHBOARD_DELEGATION_SLICE_TOKENS = [
  'teal.solid',
  'blue.solid',
  'purple.solid',
  'green.solid',
  'orange.solid',
  'red.solid',
  'cyan.solid',
] as const
