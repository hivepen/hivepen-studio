import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

function Analytics() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        {m.analytics_heading()}
      </Heading>
      <Text color="fg.muted">
        {m.analytics_description()}
      </Text>
    </Box>
  )
}
