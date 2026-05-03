import { useEffect, useState } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Box, HStack, Icon, IconButton, Input } from '@chakra-ui/react'
import {
  Bold,
  Check,
  Code,
  Italic,
  Link2,
  Strikethrough,
  Underline,
  X,
} from 'lucide-react'
import type { Editor } from '@tiptap/react'
import { m } from '@/paraglide/messages'

export default function EditorBubbleMenu({
  editor,
}: {
  editor: Editor | null
}) {
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  useEffect(() => {
    if (!editor) return
    const update = () => {
      if (!editor.isActive('link') && !isEditingLink) {
        setIsEditingLink(false)
        setLinkValue('')
        return
      }
      const href = editor.getAttributes('link').href as string | undefined
      if (href && !isEditingLink) {
        setLinkValue(href)
      }
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor, isEditingLink])

  if (!editor) return null

  const applyLink = () => {
    const url = linkValue.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setIsEditingLink(false)
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setIsEditingLink(false)
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: menuEditor, state }) => {
        if (!menuEditor?.isEditable) return false
        if (isEditingLink) return true
        return !state.selection.empty
      }}
      options={{
        placement: 'top',
      }}
    >
      <Box
        bg="bg.panel"
        border="1px solid"
        borderColor="border"
        borderRadius="12px"
        px={2}
        py={2}
        boxShadow="lg"
      >
        {isEditingLink ? (
          <HStack gap={2}>
            <Input
              size="sm"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder={m.editor_tool_paste_link()}
              bg="bg"
              borderColor="border"
              onKeyDown={(event) => event.stopPropagation()}
              onPaste={(event) => event.stopPropagation()}
            />
            <IconButton
              size="sm"
              variant="solid"
              colorPalette="gray"
              aria-label={m.editor_tool_apply_link()}
              onClick={applyLink}
            >
              <Icon as={Check} boxSize={4} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              aria-label={m.editor_tool_cancel_link()}
              onClick={() => setIsEditingLink(false)}
            >
              <Icon as={X} boxSize={4} />
            </IconButton>
          </HStack>
        ) : (
          <HStack gap={1}>
            <InlineButton
              label={m.editor_tool_bold()}
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<Icon as={Bold} boxSize={4} />}
            />
            <InlineButton
              label={m.editor_tool_italic()}
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<Icon as={Italic} boxSize={4} />}
            />
            <InlineButton
              label={m.editor_tool_underline()}
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              icon={<Icon as={Underline} boxSize={4} />}
            />
            <InlineButton
              label={m.editor_tool_strike()}
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={<Icon as={Strikethrough} boxSize={4} />}
            />
            <InlineButton
              label={m.editor_tool_code()}
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={<Icon as={Code} boxSize={4} />}
            />
            <InlineButton
              label={m.editor_tool_link()}
              active={editor.isActive('link')}
              onClick={() => {
                const existing = editor.getAttributes('link').href as
                  | string
                  | undefined
                setLinkValue(existing ?? '')
                setIsEditingLink(true)
              }}
              icon={<Icon as={Link2} boxSize={4} />}
            />
          </HStack>
        )}
      </Box>
    </BubbleMenu>
  )
}

function InlineButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon: React.ReactElement
}) {
  return (
    <IconButton
      size="sm"
      variant={active ? 'solid' : 'ghost'}
      colorPalette="gray"
      aria-label={label}
      onClick={onClick}
    >
      {icon}
    </IconButton>
  )
}
