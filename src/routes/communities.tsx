import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/communities')({
  component: Communities,
})

function Communities() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        {m.communities_heading()}
      </Heading>
      <Text color="fg.muted">
        {m.communities_description()}
      </Text>
    </Box>
  )
}
