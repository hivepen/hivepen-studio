import {
  Box,
  Combobox,
  InputGroup,
  Portal,
  Spinner,
  Stack,
  Text,
  createListCollection,
} from '@chakra-ui/react'
import { useMemo } from 'react'

import AccountAvatar from '@/components/AccountAvatar'
import type { HiveAccountSearchResult } from '@/lib/hive/account'

type AccountOption = HiveAccountSearchResult & {
  label: string
  value: string
}

type AccountComboboxProps = {
  value: string
  onChange: (value: string) => void
  suggestions: HiveAccountSearchResult[]
  loading?: boolean
  placeholder?: string
  searchingText: string
  emptyText: string
  recentText: string
  size?: 'sm' | 'md'
  onSuggestionSelect?: (account: HiveAccountSearchResult) => void
}

const normalizeUsername = (value: string) => value.trim().replace(/^@/, '')

export default function AccountCombobox({
  value,
  onChange,
  suggestions,
  loading = false,
  placeholder,
  searchingText,
  emptyText,
  recentText,
  size = 'md',
  onSuggestionSelect,
}: AccountComboboxProps) {
  const normalizedValue = normalizeUsername(value)
  const avatarBoxSize = size === 'sm' ? 4 : 6

  const items = useMemo(
    () =>
      suggestions.map((account) => ({
        ...account,
        label: account.full_name?.trim() || account.name,
        value: account.name,
      })),
    [suggestions],
  )

  const collection = useMemo(
    () =>
      createListCollection<AccountOption>({
        items,
        itemToString: (item) => item.name,
        itemToValue: (item) => item.value,
      }),
    [items],
  )

  const selectedItem =
    normalizedValue.length > 0
      ? (items.find(
          (item) => item.name.toLowerCase() === normalizedValue.toLowerCase(),
        ) ?? null)
      : null

  return (
    <Combobox.Root
      allowCustomValue
      collection={collection}
      inputValue={value}
      openOnClick
      openOnChange={(details) => {
        const nextValue = normalizeUsername(details.inputValue)
        return nextValue.length === 0 || nextValue.length > 1
      }}
      positioning={{ sameWidth: true }}
      size={size}
      value={selectedItem ? [selectedItem.value] : []}
      onInputValueChange={(details) => {
        if (
          details.reason !== 'input-change' &&
          normalizeUsername(details.inputValue).length > 0
        ) {
          return
        }
        onChange(normalizeUsername(details.inputValue))
      }}
      onValueChange={(details) => {
        const nextItem = details.items[0]
        if (!nextItem) return
        onSuggestionSelect?.(nextItem)
        onChange(nextItem.name)
      }}
    >
      <Combobox.Control>
        <InputGroup
          startElement={
            normalizedValue ? (
              <AccountAvatar
                boxSize={avatarBoxSize}
                size="xs"
                username={normalizedValue}
              />
            ) : null
          }
        >
          <Combobox.Input
            bg="bg"
            borderColor="border"
            placeholder={placeholder}
          />
        </InputGroup>
        <Combobox.IndicatorGroup>
          {loading ? <Spinner size="xs" /> : null}
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content
            bg="bg.panel"
            borderColor="border"
            maxH="72"
            overflowY="auto"
          >
            {loading && items.length === 0 ? (
              <Box px="3" py="2">
                <Text color="fg.muted" fontSize="sm">
                  {searchingText}
                </Text>
              </Box>
            ) : null}
            {!loading && items.length === 0 ? (
              <Combobox.Empty px="3" py="2">
                <Text color="fg.muted" fontSize="sm">
                  {normalizedValue.length === 0 ? recentText : emptyText}
                </Text>
              </Combobox.Empty>
            ) : null}
            {items.map((item) => (
              <Combobox.Item key={item.value} item={item}>
                <Combobox.ItemText>
                  <Stack gap="2" minW="0">
                    <Box display="flex" alignItems="center" gap="3" minW="0">
                      <AccountAvatar
                        boxSize={avatarBoxSize}
                        size="xs"
                        username={item.name}
                      />
                      <Stack flex="1" gap="0.5" minW="0">
                        <Text fontWeight="600" lineClamp={1}>
                          {item.label}
                        </Text>
                        <Text color="fg.muted" fontSize="xs" lineClamp={1}>
                          @{item.name}
                        </Text>
                      </Stack>
                    </Box>
                    {item.about ? (
                      <Text color="fg.muted" fontSize="xs" lineClamp={1}>
                        {item.about}
                      </Text>
                    ) : null}
                  </Stack>
                </Combobox.ItemText>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  )
}
