import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/drafts')({
  component: Drafts,
})

function Drafts() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        {m.drafts_heading()}
      </Heading>
      <Text color="fg.muted">{m.drafts_description()}</Text>
    </Box>
  )
}
