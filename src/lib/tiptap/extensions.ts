import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Mention from '@tiptap/extension-mention'
import GlobalDragHandle from '@/lib/tiptap/globalDragHandle'
import SlashCommand from '@/lib/tiptap/slashCommand'
import type { SlashCommandItem } from '@/lib/tiptap/slashCommand'

type EditorExtensionsOptions = {
  mentionSuggestion: Parameters<typeof Mention.configure>[0]['suggestion']
  slashCommandItems?: SlashCommandItem[]
}

export const getEditorExtensions = ({
  mentionSuggestion,
  slashCommandItems = [],
}: EditorExtensionsOptions) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    link: false,
    underline: false,
  }),
  Placeholder.configure({
    includeChildren: true,
    placeholder: ({ node }) => {
      if (node.type.name === 'heading') {
        return `Heading ${node.attrs.level ?? 1}`
      }
      if (node.type.name === 'codeBlock') {
        return 'Write some code...'
      }
      return "Press '/' for commands"
    },
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
  }),
  Image.configure({
    allowBase64: false,
  }),
  Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    suggestion: mentionSuggestion,
  }),
  GlobalDragHandle.configure({
    dragHandleWidth: 20,
  }),
  SlashCommand.configure({
    items: slashCommandItems,
  }),
]
