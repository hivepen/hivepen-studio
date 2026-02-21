import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/engagement')({
  component: Engagement,
})

function Engagement() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Engagement
      </Heading>
      <Text color="fg.muted">
        Manage replies, comments, and community interactions from one place.
      </Text>
    </Box>
  )
}
