import {
  Box,
  Combobox,
  Portal,
  Spinner,
  Text,
  useListCollection,
  HStack,
  InputGroup,
} from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'

import { listCommunities } from '@/lib/hive/client'
import { fetchCommunity } from '@/lib/hive/community'
import type { HiveCommunity } from '@/lib/hive/client'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { Avatar } from '@/components/ui/avatar'
import { m } from '@/paraglide/messages'
import { discoveryCache } from '@/features/discovery-cache'
import useDiscoverySnapshot from '@/features/discovery-cache/useDiscoverySnapshot'

type CommunityOption = {
  label: string
  value: string
  description?: string
  community: HiveCommunity
}

export default function CommunityCombobox({
  value,
  onChange,
  size = 'md',
}: {
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
}) {
  const [query, setQuery] = useState(value)
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CommunityOption | null>(null)
  const userTypingRef = useRef(false)
  const prevValueRef = useRef(value)
  const trimmedQuery = query.trim()
  const { snapshot: cachedCommunities, refresh: refreshCachedCommunities } =
    useDiscoverySnapshot('communities', trimmedQuery, trimmedQuery ? 12 : 8)

  const { collection, set } = useListCollection({
    initialItems: [],
    itemToString: (item) => item.label,
    itemToValue: (item) => item.value,
  })

  const toOption = (community: HiveCommunity): CommunityOption => ({
    label: community.title || community.name || community.id,
    value: community.name || community.id,
    description: community.about,
    community,
  })

  useEffect(() => {
    if (!trimmedQuery) {
      const fallback = cachedCommunities.results.map(toOption)
      if (
        selectedItem &&
        !fallback.some((item) => item.value === selectedItem.value)
      ) {
        fallback.unshift(selectedItem)
      }
      set(fallback)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const handle = setTimeout(() => {
      listCommunities(trimmedQuery)
        .then((result) => {
          if (!active) return
          discoveryCache.cacheSearchResults('communities', trimmedQuery, result)
          refreshCachedCommunities()
          const items = result.map(toOption)
          if (
            selectedItem &&
            !items.some((item) => item.value === selectedItem.value)
          ) {
            items.unshift(selectedItem)
          }
          const matched = selectedItem
            ? items.find((item) => item.value === selectedItem.value)
            : undefined
          if (matched && matched.label !== selectedItem?.label) {
            setSelectedItem(matched)
          }
          set(items)
        })
        .catch(() => {
          if (!active) return
          set(selectedItem ? [selectedItem] : [])
        })
        .finally(() => {
          if (!active) return
          setLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [
    cachedCommunities.results,
    refreshCachedCommunities,
    selectedItem,
    set,
    trimmedQuery,
  ])

  useEffect(() => {
    if (value === prevValueRef.current) return
    prevValueRef.current = value
    userTypingRef.current = false
    if (!value) {
      setSelectedItem(null)
      setQuery('')
      return
    }
    setSelectedItem((prev) =>
      prev?.value === value
        ? prev
        : {
            label: value,
            value,
            community: { id: value, name: value },
          },
    )
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!selectedItem) return
    if (selectedItem.label !== selectedItem.value) return
    let active = true
    fetchCommunity(selectedItem.value)
      .then((match) => {
        if (!active || !match) return
        const label = match.title || match.name || match.id
        const resolvedValue = match.name || match.id
        setSelectedItem({
          label,
          value: resolvedValue,
          description: match.about,
          community: match,
        })
        if (!userTypingRef.current) {
          setQuery(label)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [selectedItem])

  return (
    <Combobox.Root
      collection={collection}
      value={selectedItem ? [selectedItem.value] : []}
      inputValue={query}
      size={size}
      onValueChange={(details) => {
        const selectedValue = details.value[0]
        const nextItem =
          collection.items.find((item) => item.value === selectedValue) ??
          (selectedValue
            ? {
                label: selectedValue,
                value: selectedValue,
                community: { id: selectedValue, name: selectedValue },
              }
            : null)

        userTypingRef.current = false
        setSelectedItem(nextItem)
        if (nextItem) {
          discoveryCache.recordSelection('communities', nextItem.community)
          refreshCachedCommunities()
          setQuery(nextItem.label)
        }
        const nextValue = selectedValue ?? ''
        if (nextValue !== value) {
          onChange(nextValue)
        }
      }}
      onInputValueChange={(details) => {
        const nextValue = details.inputValue
        if (details.reason !== 'input-change') return
        userTypingRef.current = true
        if (nextValue.trim().length === 0) {
          setSelectedItem(null)
          onChange('')
        } else {
          setSelectedItem(null)
        }
        setQuery(nextValue)
      }}
      openOnChange={(details) =>
        details.inputValue.length === 0 || details.inputValue.length > 1
      }
    >
      <Combobox.Label>
        <Text fontSize="sm" color="fg.muted">
          {m.community_label()}
        </Text>
      </Combobox.Label>
      <Combobox.Control>
        <InputGroup
          startElement={
            selectedItem ? (
              <Avatar
                ms={-2}
                size="xs"
                src={getHiveAvatarUrl(selectedItem.value)}
                name={selectedItem.label}
              />
            ) : null
          }
        >
          <Combobox.Input
            placeholder={m.community_search_placeholder()}
            bg="bg"
            borderColor="border"
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
          <Combobox.Content bg="bg.panel" borderColor="border">
            <Combobox.Empty>
              <Text fontSize="sm" color="fg.muted">
                {m.community_none_found()}
              </Text>
            </Combobox.Empty>
            {(collection?.items ?? []).map((item) => (
              <Combobox.Item key={item.value} item={item}>
                <Combobox.ItemText>
                  <HStack gap={3} align="center">
                    <Avatar
                      size="xs"
                      src={getHiveAvatarUrl(item.value)}
                      name={item.label}
                    />
                    <Box>
                      <Text fontWeight="600">{item.label}</Text>
                      {item.description && (
                        <Text fontSize="xs" color="fg.muted" noOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="fg.subtle">
                        {item.value}
                      </Text>
                    </Box>
                  </HStack>
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
