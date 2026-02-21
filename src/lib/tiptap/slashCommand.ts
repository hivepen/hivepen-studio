import { Extension } from '@tiptap/core'
import type { Editor, Range } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'

import SlashCommandMenu from '@/components/editor/SlashCommandMenu'

export type SlashCommandItem = {
  title: string
  category: string
  description?: string
  shortcut?: string
  icon: React.ReactNode
  command: (props: { editor: Editor; range: Range }) => void
}

type SlashCommandOptions = {
  items: SlashCommandItem[]
}

const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slash-command',
  addOptions() {
    return {
      items: [],
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        items: ({ query }) => {
          const normalized = query.trim().toLowerCase()
          if (!normalized) return this.options.items
          return this.options.items.filter((item) => {
            const match = item.title.toLowerCase().includes(normalized)
            const categoryMatch = item.category.toLowerCase().includes(normalized)
            const descriptionMatch = item.description
              ? item.description.toLowerCase().includes(normalized)
              : false
            return match || descriptionMatch || categoryMatch
          })
        },
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        render: () => {
          let component: ReactRenderer | null = null
          return {
            onStart: (props) => {
              const parentNode = props.editor.state.selection.$from.parent
              if (parentNode.type.name === 'codeBlock') {
                return false
              }
              if (!props.clientRect) {
                return false
              }
              component = new ReactRenderer(SlashCommandMenu, {
                props: {
                  ...props,
                  anchorRect: props.clientRect,
                },
                editor: props.editor,
              })
            },
            onUpdate: (props) => {
              if (!props.clientRect) return
              component?.updateProps({
                ...props,
                anchorRect: props.clientRect,
              })
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                component?.destroy()
                return true
              }
              // TODO: Ensure arrow/enter navigation is captured by the menu.
              // When focus remains in the editor, arrow keys move the cursor.
              // @ts-expect-error - exposed by ReactRenderer ref
              return component?.ref?.onKeyDown?.(props)
            },
            onExit: () => {
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})

export default SlashCommand
