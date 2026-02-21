import { Box, HStack, Icon, IconButton } from '@chakra-ui/react'
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
} from 'lucide-react'

export default function EditorToolbar({
  editor,
  onInsertImage,
}: {
  editor: Editor | null
  onInsertImage?: () => void
}) {
  if (!editor) return null

  useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => ({
      selection: activeEditor.state.selection,
      storedMarks: activeEditor.state.storedMarks,
    }),
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
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<Icon as={Bold} boxSize={4} />}
        />
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<Icon as={Italic} boxSize={4} />}
        />
        <ToolbarButton
          label="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<Icon as={Underline} boxSize={4} />}
        />
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          icon={<Icon as={Strikethrough} boxSize={4} />}
        />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<Icon as={Heading2} boxSize={4} />}
        />
        <ToolbarButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={<Icon as={Quote} boxSize={4} />}
        />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={<Icon as={List} boxSize={4} />}
        />
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={<Icon as={ListOrdered} boxSize={4} />}
        />
        <ToolbarButton
          label="Code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          icon={<Icon as={Code} boxSize={4} />}
        />
        <ToolbarButton
          label="Code block"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          icon={<Icon as={Code2} boxSize={4} />}
        />
        <ToolbarButton
          label="Horizontal rule"
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={<Icon as={Minus} boxSize={4} />}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive('link')}
          onClick={handleAddLink}
          icon={<Icon as={Link2} boxSize={4} />}
        />
        <ToolbarButton
          label="Image"
          active={false}
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
          onClick={() => editor.chain().focus().undo().run()}
          icon={<Icon as={Undo2} boxSize={4} />}
        />
        <ToolbarButton
          label="Redo"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
          icon={<Icon as={Redo2} boxSize={4} />}
        />
      </HStack>
    </Box>
  )
}

function ToolbarButton({
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
