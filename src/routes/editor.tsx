import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import { Box, Button, Icon, Input, Stack, Tabs, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, type Editor as TiptapEditor } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  SendIcon,
  Settings2,
  SquarePen,
  Text as TextIcon,
  Code,
} from 'lucide-react'

import CustomHeader from '@/components/CustomHeader'
import EditorBubbleMenu from '@/components/editor/EditorBubbleMenu'
import EditorBody from '@/components/editor/EditorBody'
import EditorCollaborationUsers from '@/components/editor/EditorCollaborationUsers'
import EditorSettingsPanel from '@/components/editor/EditorSettingsPanel'
import EditorToolbar from '@/components/editor/EditorToolbar'
import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { getEditorExtensions } from '@/lib/tiptap/extensions'
import {
  getHiveSignerAuth,
  getHiveSignerLoginUrl,
  persistHiveSignerAuthFromUrl,
} from '@/lib/hive/hivesigner'
import { broadcastOperations, getHiveKeychain } from '@/lib/hive/keychain'
import { buildPostOperations, parseTags } from '@/lib/hive/operations'
import { uploadImageToHive } from '@/lib/hive/imageHoster'

export const Route = createFileRoute('/editor')({
  component: Editor,
})

type StatusState = {
  type: 'success' | 'error' | 'info'
  message: string
}

type BeneficiaryEntry = {
  account: string
  weight: string
}

function Editor() {
  const [account] = useLocalStorageState<string | null>('hivepen.account', null)
  const [status, setStatus] = useState<StatusState | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [keychainDetected, setKeychainDetected] = useState(false)
  const [collaborationReady] = useState(true)
  const [hiveSignerAuth, setHiveSignerAuth] = useState(() => getHiveSignerAuth())
  const [hiveSignerLoginUrl] = useState(() => getHiveSignerLoginUrl())
  const hiveSignerAuthRef = useRef(hiveSignerAuth)
  const [showBlockHandles, setShowBlockHandles] = useState(true)

  const [postPayload, setPostPayload] = useState({
    title: '',
    body: '',
    tags: '',
    community: '',
    summary: '',
    thumbnail: '',
  })

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryEntry[]>([
    { account: 'hivepen', weight: '400' },
  ])

  const tagPreview = useMemo(() => parseTags(postPayload.tags), [postPayload.tags])
  const mentionItems = useMemo(
    () => ['hivepen', 'hiveio', 'ecency', 'peakd', 'inleo', 'vibes'],
    []
  )

  const mentionSuggestion = useMemo(
    () => ({
      items: ({ query }) =>
        mentionItems
          .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 5),
      render: () => {
        let popup: HTMLDivElement | null = null

        const renderItems = (props: {
          items: string[]
          command: (args: { id: string }) => void
          clientRect?: () => DOMRect | null
        }) => {
          if (!popup) return
          const rect = props.clientRect?.()
          if (rect) {
            popup.style.left = `${rect.left + window.scrollX}px`
            popup.style.top = `${rect.bottom + window.scrollY + 6}px`
          }
          popup.innerHTML = ''
          props.items.forEach((item) => {
            const button = document.createElement('button')
            button.textContent = item
            button.className = 'mention-menu__item'
            button.onclick = () => props.command({ id: item })
            popup?.appendChild(button)
          })
        }

        return {
          onStart: (props) => {
            popup = document.createElement('div')
            popup.className = 'mention-menu'
            popup.style.position = 'absolute'
            document.body.appendChild(popup)
            renderItems(props)
          },
          onUpdate: (props) => {
            renderItems(props)
          },
          onKeyDown: ({ event }) => {
            if (event.key === 'Escape') {
              popup?.remove()
              popup = null
              return true
            }
            return false
          },
          onExit: () => {
            popup?.remove()
            popup = null
          },
        }
      },
    }),
    [mentionItems]
  )

  const handleInsertImage = useCallback(async (targetEditor: TiptapEditor | null) => {
    if (!targetEditor) return
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0]
      if (!file) return

      const auth = hiveSignerAuthRef.current
      if (!auth?.accessToken) {
        setStatus({
          type: 'error',
          message: 'Connect HiveSigner to upload images.',
        })
        return
      }

      try {
        setStatus({ type: 'info', message: 'Uploading image...' })
        const url = await uploadImageToHive({
          file,
          accessToken: auth.accessToken,
        })
        targetEditor.chain().focus().setImage({ src: url }).run()
        setStatus({ type: 'success', message: 'Image uploaded.' })
      } catch (error) {
        console.error('[editor] Image upload failed', error)
        setStatus({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Image upload failed.',
        })
      }
    }
    fileInput.click()
  }, [])

  const slashCommandItems = useMemo(
    () => [
      {
        title: 'Text',
        category: 'Basic',
        description: 'Start writing with plain text.',
        icon: <TextIcon size={18} />,
        shortcut: '↵',
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setParagraph().run(),
      },
      {
        title: 'Heading 1',
        category: 'Basic',
        description: 'Large section heading.',
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
      },
      {
        title: 'Heading 2',
        category: 'Basic',
        description: 'Medium section heading.',
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
      },
      {
        title: 'Heading 3',
        category: 'Basic',
        description: 'Small section heading.',
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
      },
      {
        title: 'Bullet List',
        category: 'Lists',
        description: 'Create a bulleted list.',
        icon: <List size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleBulletList().run(),
      },
      {
        title: 'Numbered List',
        category: 'Lists',
        description: 'Create a numbered list.',
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
      },
      {
        title: 'Quote',
        category: 'Blocks',
        description: 'Capture a quote.',
        icon: <Quote size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      },
      {
        title: 'Code Block',
        category: 'Blocks',
        description: 'Insert a block of code.',
        icon: <Code size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        title: 'Divider',
        category: 'Blocks',
        description: 'Insert a horizontal divider.',
        icon: <Minus size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      },
      {
        title: 'Image',
        category: 'Media',
        description: 'Upload or embed an image.',
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run()
          void handleInsertImage(editor)
        },
      },
    ],
    [handleInsertImage]
  )

  const editor = useEditor({
    extensions: getEditorExtensions({
      mentionSuggestion,
      slashCommandItems,
    }),
    content: postPayload.body || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setPostPayload((prev) => ({ ...prev, body: editor.getHTML() }))
    },
  })

  useEffect(() => {
    setKeychainDetected(Boolean(getHiveKeychain()))
    const auth = persistHiveSignerAuthFromUrl()
    if (auth) {
      setHiveSignerAuth(auth)
    }
  }, [])

  useEffect(() => {
    hiveSignerAuthRef.current = hiveSignerAuth
  }, [hiveSignerAuth])

  const handlePublish = async () => {
    if (!account) {
      setStatus({ type: 'error', message: 'Connect Hive Keychain first.' })
      return
    }

    if (!postPayload.title.trim() || !postPayload.body.trim()) {
      setStatus({ type: 'error', message: 'Title and body are required.' })
      return
    }

    const filteredBeneficiaries = beneficiaries
      .map((entry) => ({
        account: entry.account.trim(),
        weight: Number(entry.weight),
      }))
      .filter(
        (entry) =>
          entry.account.length > 0 &&
          Number.isFinite(entry.weight) &&
          entry.weight > 0
      )

    setIsPublishing(true)
    setStatus(null)

    const { operations } = buildPostOperations({
      author: account,
      title: postPayload.title.trim(),
      body: postPayload.body.trim(),
      tags: postPayload.tags,
      community: postPayload.community.trim() || undefined,
      summary: postPayload.summary.trim() || undefined,
      thumbnail: postPayload.thumbnail.trim() || undefined,
      beneficiaries: filteredBeneficiaries,
    })

    const response = await broadcastOperations(account, operations, 'Posting')

    if (response.success) {
      setStatus({
        type: 'success',
        message: 'Post broadcasted. It should appear on Hive shortly.',
      })
      setPostPayload((prev) => ({
        ...prev,
        title: '',
        body: '',
        summary: '',
        thumbnail: '',
      }))
      editor?.commands.setContent('')
    } else {
      setStatus({
        type: 'error',
        message: response.message ?? 'Post broadcast failed.',
      })
    }

    setIsPublishing(false)
  }

  const handleSelectCommunity = (value: string) => {
    setPostPayload((prev) => ({ ...prev, community: value }))
  }

  const publishReady = Boolean(postPayload.title.trim() && postPayload.body.trim())


  return (
    <Box h="100%" overflow="hidden">
      {collaborationReady && (
        <Stack h="100%" minH={0}>
          <CustomHeader
            title={
              <Input
                value={postPayload.title}
                onChange={(event) =>
                  setPostPayload((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                variant="flushed"
                placeholder="Untitled Draft"

                // border="none"
                fontSize="lg"
                fontWeight="600"
              />
            }
          >
            <EditorCollaborationUsers users={[]} />
            <Button
              colorPalette="gray"
              onClick={handlePublish}
              loading={isPublishing}
              disabled={!keychainDetected || !publishReady}
            >
              Publish
              <SendIcon size={16} />
            </Button>
          </CustomHeader>

          {status && (
            <Box
              bg="bg.subtle"
              border="1px solid"
              borderColor="border"
              borderRadius="12px"
              px={4}
              py={3}
            >
              <Text>{status.message}</Text>
              {status.type === 'error' && hiveSignerLoginUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  mt={3}
                  asChild
                >
                  <a href={hiveSignerLoginUrl}>Connect HiveSigner</a>
                </Button>
              )}
            </Box>
          )}

          <Box flex="1" minH={0}>
            <ClientOnly
              fallback={
                <Box px="4" py={6}>
                  <Text fontSize="sm" color="fg.muted">
                    Loading editor…
                  </Text>
                </Box>
              }
            >
              <Tabs.Root
                defaultValue="editor"
                variant="outline"
                mt={0}
                display="flex"
                flexDirection="column"
                h="100%"
                minH={0}
              >
                <Tabs.List flex="0 0 auto">
                  <Tabs.Trigger value="editor">
                    <Icon as={SquarePen} boxSize={4} />
                    Content
                  </Tabs.Trigger>
                  <Tabs.Trigger value="config">
                    <Icon as={Settings2} boxSize={4} />
                    Configuration
                  </Tabs.Trigger>
                </Tabs.List>
                <Box px="4" flex="1" minH={0} display="flex" flexDirection="column">
                  <Tabs.Content
                    value="editor"
                    mt={4}
                    flex="1"
                    minH={0}
                    display="flex"
                    flexDirection="column"
                  >
                    <Stack gap={4} flex="1" minH={0}>
                      <EditorToolbar
                        editor={editor}
                        onInsertImage={() => handleInsertImage(editor)}
                      />
                      <EditorBubbleMenu editor={editor} />
                      <Box flex="1" minH={0} overflowY="auto" pr={2}>
                        <EditorBody editor={editor} showBlockHandles={showBlockHandles} />
                      </Box>
                    </Stack>
                  </Tabs.Content>
                  <Tabs.Content value="config" mt={4} flex="1" minH={0} overflowY="auto">
                    <EditorSettingsPanel
                      publishForm={postPayload}
                      publishTags={tagPreview}
                      publishStatus={status}
                      keychainAvailable={keychainDetected}
                      publishReady={publishReady}
                      beneficiaries={beneficiaries}
                      onSelectCommunity={handleSelectCommunity}
                      onChange={(field, value) =>
                        setPostPayload((prev) => ({ ...prev, [field]: value }))
                      }
                      onBeneficiaryChange={(index, field, value) =>
                        setBeneficiaries((prev) =>
                          prev.map((entry, idx) =>
                            idx === index ? { ...entry, [field]: value } : entry
                          )
                        )
                      }
                      onAddBeneficiary={() =>
                        setBeneficiaries((prev) => [
                          ...prev,
                          { account: '', weight: '' },
                        ])
                      }
                      showBlockHandles={showBlockHandles}
                      onToggleBlockHandles={setShowBlockHandles}
                      onPublish={handlePublish}
                    />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </ClientOnly>
            {!keychainDetected && (
              <Text color="fg.muted" fontSize="sm" p={6}>
                HiveKeychain was not detected. Install and unlock it to publish directly from the editor.
              </Text>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  )
}
