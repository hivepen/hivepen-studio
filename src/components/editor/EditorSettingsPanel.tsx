import { Box, Button, Heading, Input, SimpleGrid, Stack, Switch, Text } from '@chakra-ui/react'
import CommunityCombobox from '@/components/CommunityCombobox'
import CustomCollapsible from '@/components/CustomCollapsible'
import TagSuggestionsInput from '@/components/TagSuggestionsInput'
import WeightSlider from '@/components/WeightSlider'
import { ClientOnly } from '@tanstack/react-router'

type BeneficiaryEntry = {
  account: string
  weight: string
}

type PublishForm = {
  title: string
  body: string
  tags: string
  community: string
  summary: string
  thumbnail: string
}

export default function EditorSettingsPanel({
  publishForm,
  publishTags,
  publishStatus,
  keychainAvailable,
  publishReady,
  beneficiaries,
  onSelectCommunity,
  onChange,
  onBeneficiaryChange,
  onAddBeneficiary,
  onPublish,
  showBlockHandles,
  onToggleBlockHandles,
}: {
  publishForm: PublishForm
  publishTags: string[]
  publishStatus: { type: 'success' | 'error' | 'info'; message: string } | null
  keychainAvailable: boolean
  publishReady: boolean
  beneficiaries: BeneficiaryEntry[]
  onSelectCommunity: (value: string) => void
  onChange: (field: keyof PublishForm, value: string) => void
  onBeneficiaryChange: (index: number, field: keyof BeneficiaryEntry, value: string) => void
  onAddBeneficiary: () => void
  onPublish: () => void
  showBlockHandles: boolean
  onToggleBlockHandles: (nextValue: boolean) => void
}) {
  const handleTagsChange = (nextTags: string[]) => {
    onChange('tags', nextTags.join(', '))
  }

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="sm" mb={2}>
          Publish settings
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Configure where the post is published, tags, and advanced settings like
          thumbnails or beneficiaries.
        </Text>
      </Box>

      {publishStatus && (
        <Box
          bg="bg.subtle"
          border="1px solid"
          borderColor="border"
          borderRadius="12px"
          px={4}
          py={3}
        >
          <Text>{publishStatus.message}</Text>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <CommunityCombobox
          value={publishForm.community}
          onChange={(value) => onSelectCommunity(value)}
        />
        <ClientOnly
          fallback={
            <Box>
              <Text fontSize="sm" color="fg.muted" mb={2}>
                Tags
              </Text>
              <Input placeholder="Add tags" bg="bg.panel" borderColor="border" />
              <Text fontSize="xs" color="fg.muted" mt={2}>
                Up to 8 tags. Use letters and numbers only.
              </Text>
            </Box>
          }
        >
          <TagSuggestionsInput value={publishTags} onChange={handleTagsChange} max={8} />
        </ClientOnly>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Input
          placeholder="Thumbnail URL"
          value={publishForm.thumbnail}
          onChange={(event) => onChange('thumbnail', event.target.value)}
          bg="bg.panel"
          borderColor="border"
        />
        <Input
          placeholder="Short description"
          value={publishForm.summary}
          onChange={(event) => onChange('summary', event.target.value)}
          bg="bg.panel"
          borderColor="border"
        />
      </SimpleGrid>

      <CustomCollapsible title="Beneficiaries">
        <Box>
          <Stack gap={3}>
            {beneficiaries.map((entry, index) => (
              <SimpleGrid key={`beneficiary-${index}`} columns={{ base: 1, md: 2 }} gap={3}>
                <Input
                  placeholder="Account"
                  value={entry.account}
                  onChange={(event) =>
                    onBeneficiaryChange(index, 'account', event.target.value)
                  }
                  bg="bg.panel"
                  borderColor="border"
                />
                <WeightSlider
                  value={entry.weight}
                  onChange={(nextValue) =>
                    onBeneficiaryChange(index, 'weight', String(nextValue))
                  }
                  label="Weight"
                  helperText="Percentage of post rewards."
                />
              </SimpleGrid>
            ))}
          </Stack>
          <Button mt={3} variant="outline" onClick={onAddBeneficiary}>
            Add beneficiary
          </Button>
        </Box>
      </CustomCollapsible>

      <CustomCollapsible title="Editor preferences">
        <Stack gap={3}>
          <Switch.Root
            checked={showBlockHandles}
            onCheckedChange={(details) => onToggleBlockHandles(details.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label>Show block handles</Switch.Label>
          </Switch.Root>
          <Text fontSize="xs" color="fg.muted">
            Toggles the always-visible drag handles used for block reordering.
          </Text>
        </Stack>
      </CustomCollapsible>
    </Stack>
  )
}
