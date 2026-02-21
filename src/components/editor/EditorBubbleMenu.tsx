import { useEffect, useState } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { useEditorState, type Editor } from '@tiptap/react'
import { Box, HStack, Icon, IconButton, Input } from '@chakra-ui/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Check,
  X,
} from 'lucide-react'

export default function EditorBubbleMenu({ editor }: { editor: Editor | null }) {
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

  const bubbleState = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => {
      const { state } = activeEditor
      const hasSelection = !state.selection.empty
      const marks = state.storedMarks ?? state.selection.$from.marks()
      const isMarkActive = (markName: string) =>
        hasSelection
          ? activeEditor.isActive(markName)
          : marks.some((mark) => mark.type.name === markName)

      return {
        isBold: isMarkActive('bold'),
        isItalic: isMarkActive('italic'),
        isUnderline: isMarkActive('underline'),
        isStrike: isMarkActive('strike'),
        isCode: isMarkActive('code'),
        isLink: isMarkActive('link'),
      }
    },
  })

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
        if (menuEditor.isActive('link')) return true
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
              placeholder="Paste a link…"
              bg="bg"
              borderColor="border"
              onKeyDown={(event) => {
                event.stopPropagation()
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLink()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setIsEditingLink(false)
                }
              }}
              onPaste={(event) => event.stopPropagation()}
            />
            <IconButton
              size="sm"
              variant="solid"
              colorPalette="gray"
              aria-label="Apply link"
              onClick={applyLink}
            >
              <Icon as={Check} boxSize={4} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              aria-label="Cancel link"
              onClick={() => setIsEditingLink(false)}
            >
              <Icon as={X} boxSize={4} />
            </IconButton>
          </HStack>
        ) : (
          <HStack gap={1}>
            <InlineButton
              label="Bold"
              active={bubbleState.isBold}
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={<Icon as={Bold} boxSize={4} />}
            />
            <InlineButton
              label="Italic"
              active={bubbleState.isItalic}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={<Icon as={Italic} boxSize={4} />}
            />
            <InlineButton
              label="Underline"
              active={bubbleState.isUnderline}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              icon={<Icon as={Underline} boxSize={4} />}
            />
            <InlineButton
              label="Strike"
              active={bubbleState.isStrike}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={<Icon as={Strikethrough} boxSize={4} />}
            />
            <InlineButton
              label="Code"
              active={bubbleState.isCode}
              onClick={() => editor.chain().focus().toggleCode().run()}
              icon={<Icon as={Code} boxSize={4} />}
            />
            <InlineButton
              label="Link"
              active={bubbleState.isLink}
              onClick={() => {
                const existing = editor.getAttributes('link').href as string | undefined
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
