import { Box, HStack, Icon, IconButton, Menu } from '@chakra-ui/react'
import { useEditorState } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import {
  AtSign,
  Bold,
  Code,
  Code2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Heading2,
  MoreHorizontal,
} from 'lucide-react'

export default function EditorToolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor | null
  onInsertImage?: () => void
}) {
  if (!editor) return null

  const toolbarState = useEditorState({
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
        isHeading2: activeEditor.isActive('heading', { level: 2 }),
        isBlockquote: activeEditor.isActive('blockquote'),
        isBulletList: activeEditor.isActive('bulletList'),
        isOrderedList: activeEditor.isActive('orderedList'),
        isCodeBlock: activeEditor.isActive('codeBlock'),
        canUndo: activeEditor.can().undo(),
        canRedo: activeEditor.can().redo(),
      }
    },
  })

  const handleAddLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Paste a link URL', previousUrl ?? '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const { from, to } = editor.state.selection
    if (from === to) {
      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'text',
            text: url,
            marks: [
              {
                type: 'link',
                attrs: { href: url },
              },
            ],
          },
        ])
        .run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      px={2}
      py={2}
      boxShadow="sm"
    >
      <HStack gap={1} flexWrap="wrap">
        <ToolbarButton
          label="Bold"
          active={toolbarState.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Icon as={Bold} boxSize={4} />}
        />
        <ToolbarButton
          label="Italic"
          active={toolbarState.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Icon as={Italic} boxSize={4} />}
        />
        <ToolbarButton
          label="Underline"
          active={toolbarState.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<Icon as={Underline} boxSize={4} />}
        />
        <ToolbarButton
          label="Strikethrough"
          active={toolbarState.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon={<Icon as={Strikethrough} boxSize={4} />}
        />
        <ToolbarButton
          label="Heading 2"
          active={toolbarState.isHeading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Icon as={Heading2} boxSize={4} />}
        />
        <ToolbarButton
          label="Quote"
          active={toolbarState.isBlockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Icon as={Quote} boxSize={4} />}
        />
        <ToolbarButton
          label="Bullet list"
          active={toolbarState.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<Icon as={List} boxSize={4} />}
        />
        <ToolbarButton
          label="Numbered list"
          active={toolbarState.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<Icon as={ListOrdered} boxSize={4} />}
        />
        <ToolbarButton
          label="Horizontal rule"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={<Icon as={Minus} boxSize={4} />}
        />
        <ToolbarButton
          label="Link"
          active={toolbarState.isLink}
          onClick={handleAddLink}
          icon={<Icon as={Link2} boxSize={4} />}
        />
        <ToolbarButton
          label="Image"
          active={false}
          disabled={!onInsertImage}
          onClick={() => onInsertImage?.()}
          icon={<Icon as={ImageIcon} boxSize={4} />}
        />
        <ToolbarButton
          label="Mention"
          active={false}
          onClick={() => editor.chain().focus().insertContent('@').run()}
          icon={<Icon as={AtSign} boxSize={4} />}
        />
        <ToolbarButton
          label="Undo"
          active={false}
          disabled={!toolbarState.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
          icon={<Icon as={Undo2} boxSize={4} />}
        />
        <ToolbarButton
          label="Redo"
          active={false}
          disabled={!toolbarState.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
          icon={<Icon as={Redo2} boxSize={4} />}
        />
        <Menu.Root positioning={{ placement: 'bottom-end' }}>
          <Menu.Trigger asChild>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette="gray"
              aria-label="More editor tools"
            >
              <Icon as={MoreHorizontal} boxSize={4} />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content minW="200px" bg="bg.panel" borderColor="border">
              <Menu.Item
                value="inline-code"
                onSelect={() => editor.chain().focus().toggleCode().run()}
              >
                Inline code
              </Menu.Item>
              <Menu.Item
                value="code-block"
                onSelect={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                Code block
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </HStack>
    </Box>
  )
}

function ToolbarButton({
  label,
  active,
  onClick,
  icon,
  disabled = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon: React.ReactElement
  disabled?: boolean
}) {
  return (
    <IconButton
      size="sm"
      variant={active ? 'solid' : 'ghost'}
      colorPalette="gray"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </IconButton>
  )
}
