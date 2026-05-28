import { Portal, Select, createListCollection } from '@chakra-ui/react'
import type { DashboardChartId } from '@/features/dashboard/dashboardCharts'
import {
  DASHBOARD_CHARTS,
  DASHBOARD_CHART_IDS,
} from '@/features/dashboard/dashboardCharts'

type DashboardChartOption = {
  value: DashboardChartId
  label: string
}

const chartCollection = createListCollection<DashboardChartOption>({
  items: DASHBOARD_CHARTS.map((chart) => ({
    value: chart.id,
    label: chart.label,
  })),
})

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
