import { createFileRoute } from '@tanstack/react-router'
import { Badge, Box, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  const highlights = [
    {
      label: 'Publishing cadence',
      value: 'Plan your next 7 days of posts',
    },
    {
      label: 'Community focus',
      value: 'Track top 3 communities by engagement',
    },
    {
      label: 'Draft workflow',
      value: 'Keep 2-3 drafts in progress',
    },
  ]

  return (
    <Stack gap={8} p={6}>
      <Box>
        <Badge colorPalette="purple" variant="subtle" mb={3}>
          Dashboard
        </Badge>
        <Heading size="lg">Welcome back to Hivepen Studio</Heading>
        <Text color="fg.muted" mt={2} maxW="640px">
          This dashboard will evolve into a command center for creators, curators,
          journalists, and writers. For now, use it to keep your publishing plan
          visible and your draft work organized.
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
        <Heading size="md">Next up</Heading>
        <Text color="fg.muted" mt={2}>
          Connect analytics, community insights, and scheduling so you can track
          publishing momentum at a glance.
        </Text>
      </Box>
    </Stack>
  )
}
