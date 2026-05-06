import { ClientOnly, createFileRoute } from '@tanstack/react-router'
import {
  Box,
  Button,
  HStack,
  Icon,
  Input,
  Show,
  Stack,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {  useEditor } from '@tiptap/react'
import {
  Code,
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
} from 'lucide-react'
import type {Editor as TiptapEditor} from '@tiptap/react';

import CustomHeader from '@/components/CustomHeader'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
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
import { buildPostOperations, parseTags } from '@/lib/hive/operations'
import { uploadImageToHive } from '@/lib/hive/imageHoster'
import { m } from '@/paraglide/messages'

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
  const { account, signAndBroadcastOperations } = useHiveWallet()
  const [status, setStatus] = useState<StatusState | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [collaborationReady] = useState(true)
  const [hiveSignerAuth, setHiveSignerAuth] = useState(() =>
    getHiveSignerAuth(),
  )
  const [hiveSignerLoginUrl] = useState(() => getHiveSignerLoginUrl())
  const hiveSignerAuthRef = useRef(hiveSignerAuth)
  const [showBlockHandles, setShowBlockHandles] = useLocalStorageState(
    'hivepen.editor.showBlockHandles',
    true,
  )

  const [postPayload, setPostPayload] = useState({
    title: '',
    body: '',
    tags: '',
    community: '',
    summary: '',
    thumbnail: '',
  })

  const [beneficiaries, setBeneficiaries] = useState<Array<BeneficiaryEntry>>([
    { account: 'hivepen', weight: '400' },
  ])

  const tagPreview = useMemo(
    () => parseTags(postPayload.tags),
    [postPayload.tags],
  )
  const mentionItems = useMemo(
    () => ['hivepen', 'hiveio', 'ecency', 'peakd', 'inleo', 'vibes'],
    [],
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
          items: Array<string>
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
    [mentionItems],
  )

  const handleInsertImage = useCallback(
    (targetEditor: TiptapEditor | null) => {
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
            message: m.editor_status_connect_hivesigner(),
          })
          return
        }

        try {
          setStatus({
            type: 'info',
            message: m.editor_status_uploading_image(),
          })
          const url = await uploadImageToHive({
            file,
            accessToken: auth.accessToken,
          })
          targetEditor.chain().focus().setImage({ src: url }).run()
          setStatus({
            type: 'success',
            message: m.editor_status_image_uploaded(),
          })
        } catch (error) {
          console.error('[editor] Image upload failed', error)
          setStatus({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : m.editor_status_image_upload_failed(),
          })
        }
      }
      fileInput.click()
    },
    [],
  )

  const slashCommandItems = useMemo(
    () => [
      {
        title: m.editor_slash_text_title(),
        category: m.editor_slash_category_basic(),
        description: m.editor_slash_text_description(),
        icon: <TextIcon size={18} />,
        shortcut: '↵',
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setParagraph().run(),
      },
      {
        title: m.editor_slash_heading1_title(),
        category: m.editor_slash_category_basic(),
        description: m.editor_slash_heading1_description(),
        icon: <Heading1 size={18} />,
        command: ({ editor, range }) =>
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 1 })
            .run(),
      },
      {
        title: m.editor_slash_heading2_title(),
        category: m.editor_slash_category_basic(),
        description: m.editor_slash_heading2_description(),
        icon: <Heading2 size={18} />,
        command: ({ editor, range }) =>
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 2 })
            .run(),
      },
      {
        title: m.editor_slash_heading3_title(),
        category: m.editor_slash_category_basic(),
        description: m.editor_slash_heading3_description(),
        icon: <Heading3 size={18} />,
        command: ({ editor, range }) =>
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setHeading({ level: 3 })
            .run(),
      },
      {
        title: m.editor_slash_bullet_list_title(),
        category: m.editor_slash_category_lists(),
        description: m.editor_slash_bullet_list_description(),
        icon: <List size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleBulletList().run(),
      },
      {
        title: m.editor_slash_numbered_list_title(),
        category: m.editor_slash_category_lists(),
        description: m.editor_slash_numbered_list_description(),
        icon: <ListOrdered size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
      },
      {
        title: m.editor_slash_quote_title(),
        category: m.editor_slash_category_blocks(),
        description: m.editor_slash_quote_description(),
        icon: <Quote size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
      },
      {
        title: m.editor_slash_code_block_title(),
        category: m.editor_slash_category_blocks(),
        description: m.editor_slash_code_block_description(),
        icon: <Code size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
      },
      {
        title: m.editor_slash_divider_title(),
        category: m.editor_slash_category_blocks(),
        description: m.editor_slash_divider_description(),
        icon: <Minus size={18} />,
        command: ({ editor, range }) =>
          editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
      },
      {
        title: m.editor_slash_image_title(),
        category: m.editor_slash_category_media(),
        description: m.editor_slash_image_description(),
        icon: <ImageIcon size={18} />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).run()
          void handleInsertImage(editor)
        },
      },
    ],
    [handleInsertImage],
  )

  const editor = useEditor({
    extensions: getEditorExtensions({
      mentionSuggestion,
      slashCommandItems,
    }),
    content: postPayload.body || '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      setPostPayload((prev) => ({ ...prev, body: currentEditor.getHTML() }))
    },
  })

  useEffect(() => {
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
      setStatus({ type: 'error', message: m.editor_status_keychain_required() })
      return
    }

    if (!postPayload.title.trim() || !postPayload.body.trim()) {
      setStatus({
        type: 'error',
        message: m.editor_status_title_body_required(),
      })
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
          entry.weight > 0,
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

    const response = await signAndBroadcastOperations(operations, 'Posting')

    if (response.success) {
      setStatus({
        type: 'success',
        message: m.editor_status_post_broadcasted(),
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
        message: response.error ?? m.editor_status_post_broadcast_failed(),
      })
    }

    setIsPublishing(false)
  }

  const handleSelectCommunity = (value: string) => {
    setPostPayload((prev) => ({ ...prev, community: value }))
  }

  const publishReady = Boolean(
    postPayload.title.trim() && postPayload.body.trim(),
  )

  return (
    <Box h="100%" overflow="hidden">
      {collaborationReady && (
        <Stack h="100%" minH={0}>
          <HStack p="4" gap="8">
            <Input
              value={postPayload.title}
              onChange={(event) =>
                setPostPayload((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              variant="flushed"
              placeholder={m.editor_untitled_placeholder()}
              // border="none"
              fontSize="lg"
              fontWeight="600"
            />
            <EditorCollaborationUsers users={[]} />
            <Show when={publishReady}>
              <Button
                colorPalette="gray"
                onClick={handlePublish}
                loading={isPublishing}
                disabled={!account || !publishReady}
              >
                {m.editor_publish_button()}
                <SendIcon size={16} />
              </Button>
            </Show>
          </HStack>

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
                <Button size="sm" variant="outline" mt={3} asChild>
                  <a href={hiveSignerLoginUrl}>
                    {m.editor_connect_hivesigner_button()}
                  </a>
                </Button>
              )}
            </Box>
          )}

          <Box flex="1" minH={0}>
            <ClientOnly
              fallback={
                <Box px="4" py={6}>
                  <Text fontSize="sm" color="fg.muted">
                    {m.editor_loading()}
                  </Text>
                </Box>
              }
            >
              <Tabs.Root
                defaultValue="editor"
                mt={0}
                display="flex"
                flexDirection="column"
                h="100%"
                minH={0}
              >
                <Tabs.List>
                  <Box
                    borderBottomWidth={0.5}
                    borderColor="colorPalette.border"
                    w="2"
                  ></Box>
                  <Tabs.Trigger value="editor">
                    <Icon as={SquarePen} boxSize={4} />
                    {m.editor_tab_content()}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="config">
                    <Icon as={Settings2} boxSize={4} />
                    {m.editor_tab_configuration()}
                  </Tabs.Trigger>
                </Tabs.List>
                <Box
                  px="4"
                  flex="1"
                  minH={0}
                  display="flex"
                  flexDirection="column"
                >
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
                        <EditorBody
                          editor={editor}
                          showBlockHandles={showBlockHandles}
                        />
                      </Box>
                    </Stack>
                  </Tabs.Content>
                  <Tabs.Content
                    value="config"
                    mt={4}
                    flex="1"
                    minH={0}
                    overflowY="auto"
                  >
                    <EditorSettingsPanel
                      publishForm={postPayload}
                      publishTags={tagPreview}
                      publishStatus={status}
                      keychainAvailable={Boolean(account)}
                      publishReady={publishReady}
                      beneficiaries={beneficiaries}
                      onSelectCommunity={handleSelectCommunity}
                      onChange={(field, value) =>
                        setPostPayload((prev) => ({ ...prev, [field]: value }))
                      }
                      onBeneficiaryChange={(index, field, value) =>
                        setBeneficiaries((prev) =>
                          prev.map((entry, idx) =>
                            idx === index
                              ? { ...entry, [field]: value }
                              : entry,
                          ),
                        )
                      }
                      onAddBeneficiary={() =>
                        setBeneficiaries((prev) => [
                          ...prev,
                          { account: '', weight: '' },
                        ])
                      }
                      onPublish={handlePublish}
                    />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </ClientOnly>
            {!account && (
              <Text color="fg.muted" fontSize="sm" p={6}>
                {m.editor_keychain_missing()}
              </Text>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  )
}
