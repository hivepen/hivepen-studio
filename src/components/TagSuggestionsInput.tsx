import {
  Box,
  Combobox,
  Portal,
  Stack,
  TagsInput,
  Text,
  useCombobox,
  useFilter,
  useListCollection,
  useTagsInput,
} from '@chakra-ui/react'
import { useId } from 'react'

const DEFAULT_SUGGESTIONS = [
  'english',
  'spanish',
  'french',
  'german',
  'italian',
  'portuguese',
  'russian',
  'arabic',
  'hindi',
  'chinese',
  'japanese',
  'korean',
  'usa',
  'canada',
  'mexico',
  'brazil',
  'argentina',
  'chile',
  'spain',
  'france',
  'germany',
  'italy',
  'uk',
  'australia',
  'newzealand',
]

const normalizeTag = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

type TagSuggestionsInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  label?: string
  helperText?: string
  suggestions?: string[]
}

export default function TagSuggestionsInput({
  value,
  onChange,
  max = 8,
  label = 'Tags',
  helperText = 'Use letters and numbers only.',
  suggestions = DEFAULT_SUGGESTIONS,
}: TagSuggestionsInputProps) {
  const uid = useId()
  const { contains } = useFilter({ sensitivity: 'base' })
  const { collection, filter } = useListCollection({
    initialItems: suggestions,
    filter: contains,
  })

  const applyTags = (nextTags: string[]) => {
    const seen = new Set<string>()
    const cleaned = nextTags
      .map((tag) => normalizeTag(tag))
      .filter((tag) => tag.length > 0)
      .filter((tag) => {
        if (seen.has(tag)) return false
        seen.add(tag)
        return true
      })
      .slice(0, max)

    onChange(cleaned)
  }

  const tags = useTagsInput({
    value,
    max,
    addOnPaste: true,
    delimiter: /[,\s]/,
    blurBehavior: 'add',
    validate: (tag) => {
      const normalized = normalizeTag(tag)
      if (!normalized) return false
      return !value.includes(normalized)
    },
    ids: { input: `tags_input_${uid}`, control: `tags_control_${uid}` },
    onValueChange: (details) => applyTags(details.value),
  })

  const combobox = useCombobox({
    ids: { input: `tags_input_${uid}`, control: `tags_control_${uid}` },
    collection,
    value: [],
    inputValue: tags.inputValue,
    allowCustomValue: true,
    selectionBehavior: 'clear',
    onInputValueChange: (details) => {
      const normalized = normalizeTag(details.inputValue)
      tags.setInputValue(normalized)
      filter(normalized)
    },
    onValueChange: (details) => {
      const selected = details.value[0]
      if (!selected) return
      tags.addValue(selected)
      tags.setInputValue('')
    },
  })

  return (
    <Combobox.RootProvider value={combobox}>
      <TagsInput.RootProvider value={tags} size="sm">
        <TagsInput.Label>
          <Text fontSize="sm" color="fg.muted">
            {label}
          </Text>
        </TagsInput.Label>

        <TagsInput.Control bg="bg.panel" borderColor="border">
          {tags.value.map((tag, index) => (
            <TagsInput.Item key={`${tag}-${index}`} index={index} value={tag}>
              <TagsInput.ItemPreview>
                <TagsInput.ItemText>{tag}</TagsInput.ItemText>
                <TagsInput.ItemDeleteTrigger />
              </TagsInput.ItemPreview>
            </TagsInput.Item>
          ))}

          <Combobox.Input unstyled asChild>
            <TagsInput.Input placeholder="Add tags" />
          </Combobox.Input>
        </TagsInput.Control>

        <Portal>
          <Combobox.Positioner>
            <Combobox.Content bg="bg.panel" borderColor="border">
              {collection.items
                .filter((item) => !value.includes(item))
                .map((item) => (
                  <Combobox.Item item={item} key={item}>
                    <Combobox.ItemText>#{item}</Combobox.ItemText>
                    <Combobox.ItemIndicator />
                  </Combobox.Item>
                ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>

        <Stack gap={1} mt={2}>
          <Text fontSize="xs" color="fg.muted">
            Up to {max} tags. {helperText}
          </Text>
        </Stack>
      </TagsInput.RootProvider>
    </Combobox.RootProvider>
  )
}
