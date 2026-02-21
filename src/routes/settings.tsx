import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Text } from '@chakra-ui/react'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Settings
      </Heading>
      <Text color="fg.muted">
        Configure studio preferences, notifications, and connected accounts.
      </Text>
    </Box>
  )
}
