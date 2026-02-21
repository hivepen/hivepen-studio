import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import type { Editor } from '@tiptap/react'
import { Box, HStack, Icon, Popover, Portal, Text } from '@chakra-ui/react'

import type { SlashCommandItem } from '@/lib/tiptap/slashCommand'

type SlashCommandMenuProps = {
  editor: Editor
  anchorRect?: () => DOMRect | null
  items: SlashCommandItem[]
  query: string
  command: (item: SlashCommandItem) => void
}

const SlashCommandMenu = forwardRef((props: SlashCommandMenuProps, ref) => {
  const { items, command, anchorRect } = props
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setSelectedIndex(0)
    setOpen(true)
  }, [items])

  const selectItem = (index: number) => {
    const item = items[index]
    if (!item) return
    command(item)
  }

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % items.length)
      return true
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
      return true
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      selectItem(selectedIndex)
      return true
    }
    return false
  }, [items.length, selectItem, selectedIndex])

  useImperativeHandle(ref, () => ({
    onKeyDown,
  }))

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'Enter' &&
        event.key !== 'Escape'
      ) {
        return
      }
      if (event.key === 'Escape') {
        setOpen(false)
        event.preventDefault()
        event.stopPropagation()
        return
      }
      const handled = onKeyDown(event)
      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => {
      document.removeEventListener('keydown', handler, true)
    }
  }, [onKeyDown, open])

  const menuItems = useMemo(() => items, [items])
  const groupedItems = useMemo(() => {
    const groups = new Map<string, SlashCommandItem[]>()
    menuItems.forEach((item) => {
      const group = groups.get(item.category) ?? []
      group.push(item)
      groups.set(item.category, group)
    })
    return Array.from(groups.entries())
  }, [menuItems])

  return (
    <Popover.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      positioning={{
        placement: 'bottom-start',
        getAnchorRect: anchorRect,
      }}
    >
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            bg="bg.panel"
            border="1px solid"
            borderColor="border"
            borderRadius="12px"
            p={2}
            minW="260px"
            maxH="320px"
            overflowY="auto"
            overscrollBehavior="contain"
            boxShadow="lg"
          >
            {!menuItems.length ? (
              <Box px={3} py={2}>
                <Text fontSize="sm" color="fg.muted">
                  No commands found.
                </Text>
              </Box>
            ) : (
              <Box>
                {groupedItems.map(([category, groupItems], groupIndex) => (
                  <Box key={category} mt={groupIndex === 0 ? 0 : 3}>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                      mb={1}
                      px={2}
                    >
                      {category}
                    </Text>
                    {groupItems.map((item) => {
                      const index = menuItems.indexOf(item)
                      const isActive = index === selectedIndex
                      return (
                        <Box
                          key={item.title}
                          px={2}
                          py={2}
                          borderRadius="10px"
                          bg={isActive ? 'bg.subtle' : 'transparent'}
                          cursor="pointer"
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => selectItem(index)}
                        >
                          <HStack gap={3} align="flex-start">
                            <Icon size="sm">{item.icon}</Icon>
                            <Box flex="1">
                              <HStack justify="space-between" align="center">
                                <Text fontWeight="600" fontSize="sm">
                                  {item.title}
                                </Text>
                                {item.shortcut ? (
                                  <Text
                                    fontSize="xs"
                                    color="fg.muted"
                                    fontFamily="mono"
                                  >
                                    {item.shortcut}
                                  </Text>
                                ) : null}
                              </HStack>
                              {item.description ? (
                                <Text fontSize="xs" color="fg.muted">
                                  {item.description}
                                </Text>
                              ) : null}
                            </Box>
                          </HStack>
                        </Box>
                      )
                    })}
                  </Box>
                ))}
              </Box>
            )}
            <Box
              mt={3}
              pt={2}
              borderTop="1px solid"
              borderColor="border.subtle"
            >
              <Text fontSize="xs" color="fg.muted" px={2}>
                ↑↓ to navigate · Enter to select · Esc to close
              </Text>
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
})

SlashCommandMenu.displayName = 'SlashCommandMenu'

export default SlashCommandMenu
