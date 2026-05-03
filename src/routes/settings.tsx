import { createFileRoute } from '@tanstack/react-router'
import { Box, HStack, Heading, Stack, Switch, Text } from '@chakra-ui/react'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import DevOnly from '@/components/DevOnly'
import PostTag from '@/components/PostTag'
import { TAG_STYLE_MAP } from '@/lib/posts/tagColorConfig'
import { m } from '@/paraglide/messages'
import ParaglideLocaleSwitcher from '@/components/LocaleSwitcher'
import { Field } from '@/components/ui/field'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  const [showBlockHandles, setShowBlockHandles] = useLocalStorageState(
    'hivepen.editor.showBlockHandles',
    true,
  )

  return (
    <Box p={6}>
      <Heading size="lg" mb={2}>
        {m.settings_heading()}
      </Heading>
      <Text color="fg.muted">{m.settings_description()}</Text>
      <Box mt={8}>
        <Heading size="sm" mb={2}>
          {m.settings_language_heading()}
        </Heading>
        <Text color="fg.muted" fontSize="sm" mb={4}>
          {m.settings_language_description()}
        </Text>
        <Field
          label={m.settings_language_label()}
          helperText={m.settings_language_description()}
        >
          <ParaglideLocaleSwitcher />
        </Field>
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
