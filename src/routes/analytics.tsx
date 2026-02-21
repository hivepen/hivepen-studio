import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/analytics')({
  component: Analytics,
})

function Analytics() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Analytics
      </Heading>
      <Text color="fg.muted">
        Track post performance, follower growth, and engagement trends.
      </Text>
    </Box>
  )
}
