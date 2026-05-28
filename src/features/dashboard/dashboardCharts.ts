export type DashboardFocus = 'all' | 'rewards' | 'publishing' | 'account'

export type DashboardChartId =
  | 'reward-income'
  | 'income-breakdown'
  | 'post-performance'
  | 'payout-distribution'
  | 'community-breakdown'
  | 'hp-delegations'

export type DashboardChartDefinition = {
  id: DashboardChartId
  label: string
  focus: Array<Exclude<DashboardFocus, 'all'>>
}

export const DASHBOARD_CHARTS: Array<DashboardChartDefinition> = [
  {
    id: 'reward-income',
    label: 'Reward income',
    focus: ['rewards'],
  },
  {
    id: 'income-breakdown',
    label: 'Income breakdown',
    focus: ['rewards'],
  },
  {
    id: 'post-performance',
    label: 'Post performance map',
    focus: ['rewards', 'publishing'],
  },
  {
    id: 'payout-distribution',
    label: 'Payout distribution',
    focus: ['publishing'],
  },
  {
    id: 'community-breakdown',
    label: 'Community reward breakdown',
    focus: ['publishing'],
  },
  {
    id: 'hp-delegations',
    label: 'Outgoing HP delegations',
    focus: ['account'],
  },
]

export const DASHBOARD_CHART_IDS = DASHBOARD_CHARTS.map((chart) => chart.id)

export function getDashboardChartDefinition(id: DashboardChartId) {
  return DASHBOARD_CHARTS.find((chart) => chart.id === id)
}

export function chartMatchesDashboardFocus(
  chart: DashboardChartDefinition,
  focus: DashboardFocus,
) {
  return focus === 'all' || chart.focus.includes(focus)
}

export function isDashboardChartVisible(
  id: DashboardChartId,
  focus: DashboardFocus,
  visibleCharts: Set<DashboardChartId>,
) {
  const chart = getDashboardChartDefinition(id)

  if (!chart) return false

  return chartMatchesDashboardFocus(chart, focus) && visibleCharts.has(id)
}
