import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/engagement')({
  component: Engagement,
})

function Engagement() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        {m.engagement_heading()}
      </Heading>
      <Text color="fg.muted">{m.engagement_description()}</Text>
    </Box>
  )
}
