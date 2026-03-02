import { createFileRoute } from '@tanstack/react-router'
import { Box, Heading, HStack, Stack, Switch, Text } from '@chakra-ui/react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import DevOnly from '@/components/DevOnly'
import PostTag from '@/components/PostTag'
import { TAG_STYLE_MAP } from '@/lib/posts/tagColorConfig'
import { m } from '@/paraglide/messages'
import ParaglideLocaleSwitcher from '@/components/LocaleSwitcher'

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
        {m.settings_heading()}
      </Heading>
      <Text color="fg.muted">
        {m.settings_description()}
      </Text>
      <Box mt={8}>
        <Heading size="sm" mb={2}>
          {m.settings_language_heading()}
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={4}>
          {m.settings_language_description()}
        </Text>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          bg="bg.panel"
          p={4}
        >
          <Text fontSize="sm" color="fg.muted" mb={3}>
            {m.settings_language_label()}
          </Text>
          <ParaglideLocaleSwitcher />
        </Box>
      </Box>

      <Box mt={8}>
        <Heading size="sm" mb={2}>
          {m.settings_editor_preferences()}
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={4}>
          {m.settings_editor_description()}
        </Text>
        <Stack gap={3}>
          <Switch.Root
            checked={showBlockHandles}
            onCheckedChange={(details) => setShowBlockHandles(details.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label>{m.settings_show_block_handles()}</Switch.Label>
          </Switch.Root>
          <Text fontSize="xs" color="fg.muted">
            {m.settings_show_block_handles_helper()}
          </Text>
        </Stack>
      </Box>

      <DevOnly
        summary="Settings debug"
        json={{
          showBlockHandles,
        }}
      />
      <DevOnly>
        <Box mt={8}>
          <Heading size="sm" mb={3}>
            {m.settings_tag_style_preview()}
          </Heading>
          <HStack gap={2} wrap="wrap">
            {Object.keys(TAG_STYLE_MAP)
              .sort()
              .map((tag) => (
                <PostTag key={tag} tag={tag} />
              ))}
          </HStack>
        </Box>
      </DevOnly>
    </Box>
  )
}
