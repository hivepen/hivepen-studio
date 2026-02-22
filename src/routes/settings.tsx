import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, Stack, Switch, Text } from '@chakra-ui/react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import DevOnly from '@/components/DevOnly'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const [showBlockHandles, setShowBlockHandles] = useLocalStorageState(
    'hivepen.editor.showBlockHandles',
    true
  )

  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        Settings
      </Heading>
      <Text color="fg.muted">
        Configure studio preferences, notifications, and connected accounts.
      </Text>
      <Box mt={8}>
        <Heading size="sm" mb={2}>
          Editor preferences
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={4}>
          Control how the editor behaves across the app.
        </Text>
        <Stack gap={3}>
          <Switch.Root
            checked={showBlockHandles}
            onCheckedChange={(details) => setShowBlockHandles(details.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label>Always show block handles</Switch.Label>
          </Switch.Root>
          <Text fontSize="xs" color="fg.muted">
            Keeps drag handles visible so you can reorder blocks without hovering.
          </Text>
        </Stack>
      </Box>

      <DevOnly
        summary="Settings debug"
        json={{
          showBlockHandles,
        }}
      />
    </Box>
  )
}
