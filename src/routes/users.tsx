import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/users')({
  component: Users,
})

function Users() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Users
      </Heading>
      <Text color="fg.muted">
        Discover notable Hive accounts, track activity, and manage relationships.
      </Text>
    </Box>
  )
}
