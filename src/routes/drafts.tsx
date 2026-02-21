import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/drafts')({
  component: Drafts,
})

function Drafts() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Drafts
      </Heading>
      <Text color="fg.muted">
        Track and organize drafts here. We will wire autosave and folder support
        next.
      </Text>
    </Box>
  )
}
