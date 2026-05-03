import {
  Box,
  Button,
  Combobox,
  InputGroup,
  Portal,
  Spinner,
  Stack,
  Text,
  Wrap,
  createListCollection,
} from '@chakra-ui/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { HiveAccountSearchResult } from '@/lib/hive/account'
import AccountAvatar from '@/components/AccountAvatar'

type AccountOption = HiveAccountSearchResult & {
  label: string
  value: string
}

type AccountComboboxProps = {
  value: string
  onChange: (value: string) => void
  suggestions: Array<HiveAccountSearchResult>
  featuredSuggestions?: Array<HiveAccountSearchResult>
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
  featuredSuggestions = [],
  loading = false,
  placeholder,
  searchingText,
  emptyText,
  recentText,
  size = 'md',
  onSuggestionSelect,
}: AccountComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AccountOption | null>(null)
  const prevValueRef = useRef(value)
  const normalizedValue = normalizeUsername(query)
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

  const featuredItems = useMemo(() => {
    const seen = new Set<string>()
    return featuredSuggestions
      .map((account) => ({
        ...account,
        label: account.full_name?.trim() || account.name,
        value: account.name,
      }))
      .filter((account) => {
        const key = account.name.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }, [featuredSuggestions])

  useEffect(() => {
    if (value === prevValueRef.current) return
    prevValueRef.current = value
    setQuery(value)
    if (!value) {
      setSelectedItem(null)
      return
    }
    setSelectedItem((prev) => {
      if (prev?.name.toLowerCase() === normalizeUsername(value).toLowerCase()) {
        return prev
      }
      const matched =
        items.find(
          (item) =>
            item.name.toLowerCase() === normalizeUsername(value).toLowerCase(),
        ) ??
        featuredItems.find(
          (item) =>
            item.name.toLowerCase() === normalizeUsername(value).toLowerCase(),
        )
      return (
        matched ?? {
          name: normalizeUsername(value),
          full_name: '',
          about: '',
          reputation: 0,
          label: normalizeUsername(value),
          value: normalizeUsername(value),
        }
      )
    })
  }, [featuredItems, items, value])

  useEffect(() => {
    if (!selectedItem) return
    const matched =
      items.find(
        (item) => item.name.toLowerCase() === selectedItem.name.toLowerCase(),
      ) ??
      featuredItems.find(
        (item) => item.name.toLowerCase() === selectedItem.name.toLowerCase(),
      )
    if (!matched) return
    setSelectedItem((prev) => {
      if (!prev || prev.name.toLowerCase() !== matched.name.toLowerCase()) {
        return prev
      }
      return matched
    })
  }, [featuredItems, items, selectedItem])

  const handleAccountSelect = (account: AccountOption) => {
    prevValueRef.current = account.name
    setSelectedItem(account)
    setQuery(account.name)
    setOpen(false)
    onSuggestionSelect?.(account)
    onChange(account.name)
  }

  return (
    <Combobox.Root
      allowCustomValue
      collection={collection}
      inputValue={query}
      open={open}
      openOnClick
      openOnChange={(details) => {
        const nextValue = normalizeUsername(details.inputValue)
        return nextValue.length === 0 || nextValue.length > 1
      }}
      positioning={{ sameWidth: true }}
      size={size}
      value={selectedItem ? [selectedItem.value] : []}
      onOpenChange={(details) => setOpen(details.open)}
      onInputValueChange={(details) => {
        if (
          details.reason !== 'input-change' &&
          details.reason !== 'clear-trigger'
        ) {
          return
        }
        const nextValue = normalizeUsername(details.inputValue)
        prevValueRef.current = nextValue
        setSelectedItem(null)
        setQuery(nextValue)
        onChange(nextValue)
      }}
      onValueChange={(details) => {
        const nextItem = details.items[0]
        if (!nextItem) return
        handleAccountSelect(nextItem)
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
            {featuredItems.length > 0 ? (
              <Wrap px="3" py="3" gap="2">
                {featuredItems.map((item) => (
                  <Button
                    key={`featured-${item.value}`}
                    aria-label={`Use @${item.name}`}
                    borderRadius="full"
                    minW="auto"
                    h="auto"
                    p="0"
                    variant="ghost"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleAccountSelect(item)}
                  >
                    <AccountAvatar boxSize={6} size="xs" username={item.name} />
                  </Button>
                ))}
              </Wrap>
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
