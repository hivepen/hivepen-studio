import { Box } from '@chakra-ui/react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'

export default function EditorBody({
  editor,
  showBlockHandles = true,
}: {
  editor: Editor | null
  showBlockHandles?: boolean
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      p={6}
      minH="60vh"
      data-show-handles={showBlockHandles ? 'true' : 'false'}
      css={{
        '& .ProseMirror': {
          minHeight: '50vh',
          outline: 'none',
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'var(--chakra-colors-fg)',
        },
        '& .ProseMirror > *': {
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        },
        '& .ProseMirror h1': {
          fontSize: '1.8rem',
          lineHeight: 1.3,
          fontWeight: 700,
          marginTop: '1.5rem',
        },
        '& .ProseMirror h2': {
          fontSize: '1.45rem',
          lineHeight: 1.35,
          fontWeight: 650,
          marginTop: '1.25rem',
        },
        '& .ProseMirror h3': {
          fontSize: '1.2rem',
          lineHeight: 1.4,
          fontWeight: 600,
          marginTop: '1rem',
        },
        '& .ProseMirror p': {
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        },
        '& .ProseMirror em, & .ProseMirror i': {
          fontStyle: 'italic',
        },
        '& .ProseMirror a': {
          color: 'var(--chakra-colors-blue-600)',
          textDecoration: 'underline',
          textUnderlineOffset: '3px',
        },
        '& .ProseMirror a:hover': {
          color: 'var(--chakra-colors-blue-700)',
        },
        '& .ProseMirror ul': {
          paddingInlineStart: '1.5rem',
          listStyleType: 'disc',
          listStylePosition: 'outside',
        },
        '& .ProseMirror ol': {
          paddingInlineStart: '1.5rem',
          listStyleType: 'decimal',
          listStylePosition: 'outside',
        },
        '& .ProseMirror li': {
          marginBlock: '0.25rem',
        },
        '& .ProseMirror blockquote': {
          borderLeft: '3px solid var(--chakra-colors-border)',
          paddingInlineStart: '1rem',
          color: 'var(--chakra-colors-fg-muted)',
        },
        '& .ProseMirror pre': {
          background: 'var(--chakra-colors-bg-subtle)',
          border: '1px solid var(--chakra-colors-border)',
          borderRadius: '10px',
          padding: '0.75rem',
          overflowX: 'auto',
        },
        '& .ProseMirror code': {
          background: 'var(--chakra-colors-bg-subtle)',
          borderRadius: '6px',
          paddingInline: '0.25rem',
          paddingBlock: '0.1rem',
        },
        '& .ProseMirror hr': {
          border: 'none',
          borderTop: '1px solid var(--chakra-colors-border)',
          margin: '1.5rem 0',
        },
        '& .ProseMirror img': {
          maxWidth: '100%',
          borderRadius: '10px',
          margin: '1rem auto',
          display: 'block',
          border: '1px solid var(--chakra-colors-border)',
        },
        '& .drag-handle': {
          position: 'fixed',
          width: '24px',
          height: '24px',
          borderRadius: '8px',
          background: 'var(--chakra-colors-bg)',
          border: '1px solid var(--chakra-colors-border)',
          opacity: 1,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease',
          zIndex: 50,
        },
        '& .drag-handle:hover': {
          background: 'var(--chakra-colors-bg-subtle)',
          borderColor: 'var(--chakra-colors-border-emphasized)',
        },
        '& .drag-handle:active': {
          cursor: 'grabbing',
        },
        '& .drag-handle::before': {
          content: '"⋮⋮"',
          fontSize: '0.8rem',
          color: 'var(--chakra-colors-fg-muted)',
          letterSpacing: '-0.08em',
        },
        '& .drag-handle.hide': {
          opacity: 0,
          pointerEvents: 'none',
        },
        '&[data-show-handles="false"] .drag-handle': {
          opacity: 0,
          pointerEvents: 'none',
        },
      }}
    >
      <EditorContent editor={editor} />
    </Box>
  )
}
