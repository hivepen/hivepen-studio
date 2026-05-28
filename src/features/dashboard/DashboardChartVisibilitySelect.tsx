import { Portal, Select, createListCollection } from '@chakra-ui/react'

export type DashboardChartId =
  | 'reward-income'
  | 'income-breakdown'
  | 'post-performance'
  | 'payout-distribution'
  | 'community-breakdown'
  | 'hp-delegations'

type DashboardChartOption = {
  value: DashboardChartId
  label: string
}

const chartCollection = createListCollection<DashboardChartOption>({
  items: [
    { value: 'reward-income', label: 'Reward income' },
    { value: 'income-breakdown', label: 'Income breakdown' },
    { value: 'post-performance', label: 'Post performance map' },
    { value: 'payout-distribution', label: 'Payout distribution' },
    { value: 'community-breakdown', label: 'Community reward breakdown' },
    { value: 'hp-delegations', label: 'Outgoing HP delegations' },
  ],
})

export const DASHBOARD_CHART_IDS = chartCollection.items.map((item) => item.value)

export default function DashboardChartVisibilitySelect({
  value,
  onValueChange,
}: {
  value: Array<DashboardChartId>
  onValueChange: (value: Array<DashboardChartId>) => void
}) {
  return (
    <Select.Root
      multiple
      collection={chartCollection}
      value={value}
      onValueChange={(details) =>
        onValueChange(details.value as Array<DashboardChartId>)
      }
      size="sm"
      colorPalette="green"
      width={{ base: 'full', md: '280px' }}
      positioning={{ sameWidth: true }}
    >
      <Select.Control>
        <Select.Trigger bg="bg.panel" borderColor="colorPalette.border">
          <Select.ValueText placeholder="Visible charts">
            {value.length === DASHBOARD_CHART_IDS.length
              ? 'All charts'
              : `${value.length} charts`}
          </Select.ValueText>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Trigger>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content bg="bg.panel">
            {chartCollection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  )
}
