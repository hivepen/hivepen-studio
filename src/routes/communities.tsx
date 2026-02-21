import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/communities')({
  component: Communities,
})

function Communities() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Communities
      </Heading>
      <Text color="fg.muted">
        Search and select Hive communities with live suggestions. We will wire
        the dhive search combobox here.
      </Text>
    </Box>
  )
}
