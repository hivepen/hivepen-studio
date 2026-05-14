import {
  Box,
  Button,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { ClientOnly } from '@tanstack/react-router'
import CommunityCombobox from '@/components/CommunityCombobox'
import CustomCollapsible from '@/components/CustomCollapsible'
import DevOnly from '@/components/DevOnly'
import TagSuggestionsInput from '@/components/TagSuggestionsInput'
import WeightSlider from '@/components/WeightSlider'
import { m } from '@/paraglide/messages'

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
  publishReady,
  beneficiaries,
  onSelectCommunity,
  onChange,
  onBeneficiaryChange,
  onAddBeneficiary,
}: {
  publishForm: PublishForm
  publishTags: Array<string>
  publishStatus: { type: 'success' | 'error' | 'info'; message: string } | null
  publishReady: boolean
  beneficiaries: Array<BeneficiaryEntry>
  onSelectCommunity: (value: string) => void
  onChange: (field: keyof PublishForm, value: string) => void
  onBeneficiaryChange: (
    index: number,
    field: keyof BeneficiaryEntry,
    value: string,
  ) => void
  onAddBeneficiary: () => void
}) {
  const handleTagsChange = (nextTags: Array<string>) => {
    onChange('tags', nextTags.join(', '))
  }

  return (
    <Stack gap={6}>
      <Box>
        <Heading size="sm" mb={2}>
          {m.editor_publish_settings_title()}
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          {m.editor_publish_settings_description()}
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
                {m.tags_label()}
              </Text>
              <Input
                placeholder={m.tags_placeholder()}
                bg="bg.panel"
                borderColor="border"
              />
              <Text fontSize="xs" color="fg.muted" mt={2}>
                {m.tags_limit({ max: 8 })} {m.tags_helper()}
              </Text>
            </Box>
          }
        >
          <TagSuggestionsInput
            value={publishTags}
            onChange={handleTagsChange}
            max={8}
          />
        </ClientOnly>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Input
          placeholder={m.editor_thumbnail_placeholder()}
          value={publishForm.thumbnail}
          onChange={(event) => onChange('thumbnail', event.target.value)}
          bg="bg.panel"
          borderColor="border"
        />
        <Input
          placeholder={m.editor_summary_placeholder()}
          value={publishForm.summary}
          onChange={(event) => onChange('summary', event.target.value)}
          bg="bg.panel"
          borderColor="border"
        />
      </SimpleGrid>

      <CustomCollapsible title={m.editor_beneficiaries_title()}>
        <Box>
          <Stack gap={3}>
            {beneficiaries.map((entry, index) => (
              <SimpleGrid
                key={`beneficiary-${index}`}
                columns={{ base: 1, md: 2 }}
                gap={3}
              >
                <Input
                  placeholder={m.editor_beneficiary_account_placeholder()}
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
                  label={m.editor_beneficiary_weight_label()}
                  helperText={m.editor_beneficiary_weight_helper()}
                />
              </SimpleGrid>
            ))}
          </Stack>
          <Button mt={3} variant="outline" onClick={onAddBeneficiary}>
            {m.editor_beneficiary_add()}
          </Button>
        </Box>
      </CustomCollapsible>

      <DevOnly
        json={{
          publishForm,
          publishTags,
          beneficiaries,
          publishReady,
        }}
      />
    </Stack>
  )
}
