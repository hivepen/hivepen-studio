import { createFileRoute } from '@tanstack/react-router'
import { Badge, Box, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const highlights = [
    {
      label: m.dashboard_highlight_cadence_label(),
      value: m.dashboard_highlight_cadence_value(),
    },
    {
      label: m.dashboard_highlight_focus_label(),
      value: m.dashboard_highlight_focus_value(),
    },
    {
      label: m.dashboard_highlight_drafts_label(),
      value: m.dashboard_highlight_drafts_value(),
    },
  ]

  return (
    <Stack gap={8} p={6}>
      <Box>
        <Badge colorPalette="purple" variant="subtle" mb={3}>
          {m.dashboard_badge()}
        </Badge>
        <Heading size="lg">{m.dashboard_heading()}</Heading>
        <Text color="fg.muted" mt={2} maxW="640px">
          {m.dashboard_description()}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        {highlights.map((item) => (
          <Box
            key={item.label}
            bg="colorPalette.subtle"
            colorPalette="purple"   
            color="colorPalette.fg"
            border="1px solid"
            borderColor="colorPalette.border"
            borderRadius="2xl"
            p={5}

          >
            <Text fontSize="sm" color="colorPalette.fg">
              {item.label}
            </Text>
            <Heading size="md" mt={2}>
              {item.value}
            </Heading>
          </Box>
        ))}
      </SimpleGrid>

      <Box
        bg="bg.panel"
        border="1px dashed"
        borderColor="border"
        borderRadius="2xl"
        p={6}
      >
        <Heading size="md">{m.dashboard_next_up()}</Heading>
        <Text color="fg.muted" mt={2}>
          {m.dashboard_next_up_description()}
        </Text>
      </Box>
    </Stack>
  )
}
