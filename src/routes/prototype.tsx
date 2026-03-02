import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'

import { useLocalStorageState } from '@/hooks/useLocalStorageState'
import { fetchAccount } from '@/lib/hive/client'
import { broadcastOperations, getHiveKeychain, signLogin } from '@/lib/hive/keychain'
import {
  buildCommentOperations,
  buildPostOperations,
  parseTags,
} from '@/lib/hive/operations'
import { Alert } from '@/components/ui/alert'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/prototype')({ component: StudioHome })

type StatusState = {
  type: 'success' | 'error' | 'info'
  message: string
}

type AccountProfile = {
  name: string
  post_count?: number
  created?: string
  json_metadata?: string
}

function StudioHome() {
  const [account, setAccount, accountReady] = useLocalStorageState<string | null>(
    'hivepen.account',
    null
  )
  const [loginName, setLoginName] = useState('')
  const [status, setStatus] = useState<StatusState | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [keychainDetected, setKeychainDetected] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [postPayload, setPostPayload] = useState({
    title: '',
    body: '',
    tags: 'hive, hivepen, writing',
    community: '',
  })
  const [commentPayload, setCommentPayload] = useState({
    parentAuthor: '',
    parentPermlink: '',
    body: '',
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)

  const tagPreview = useMemo(() => parseTags(postPayload.tags), [postPayload.tags])
  const statusPalette =
    status?.type === 'error'
      ? 'red'
      : status?.type === 'success'
      ? 'green'
      : status?.type === 'info'
      ? 'blue'
      : 'gray'

  useEffect(() => {
    setKeychainDetected(Boolean(getHiveKeychain()))
  }, [])

  useEffect(() => {
    if (!account) {
      setProfile(null)
      return
    }

    let active = true
    setProfileLoading(true)

    fetchAccount(account)
      .then((data) => {
        if (active) setProfile(data as AccountProfile | null)
      })
      .catch(() => {
        if (active) setProfile(null)
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [account])

  const handleLogin = async () => {
    if (!loginName.trim()) {
      setStatus({ type: 'error', message: m.prototype_enter_username() })
      return
    }

    setIsConnecting(true)
    setStatus(null)

    const message = `Hivepen Studio login ${new Date().toISOString()}`
    const response = await signLogin(loginName.trim(), message)

    if (response.success) {
      setAccount(loginName.trim())
      setLoginName('')
      setStatus({
        type: 'success',
        message: m.prototype_connected(),
      })
    } else {
      setStatus({
        type: 'error',
        message: response.message ?? m.app_shell_login_rejected(),
      })
    }

    setIsConnecting(false)
  }

  const handleLogout = () => {
    setAccount(null)
    setStatus({ type: 'info', message: m.prototype_disconnected() })
  }

  const handlePublish = async () => {
    if (!account) {
      setStatus({ type: 'error', message: m.editor_status_keychain_required() })
      return
    }

    if (!postPayload.title.trim() || !postPayload.body.trim()) {
      setStatus({ type: 'error', message: m.editor_status_title_body_required() })
      return
    }

    setIsPublishing(true)
    setStatus(null)

    const { operations } = buildPostOperations({
      author: account,
      title: postPayload.title.trim(),
      body: postPayload.body.trim(),
      tags: postPayload.tags,
      community: postPayload.community.trim() || undefined,
    })

    const response = await broadcastOperations(account, operations, 'Posting')

    if (response.success) {
      setStatus({
        type: 'success',
        message: m.editor_status_post_broadcasted(),
      })
      setPostPayload((prev) => ({ ...prev, title: '', body: '' }))
    } else {
      setStatus({
        type: 'error',
        message: response.message ?? m.editor_status_post_broadcast_failed(),
      })
    }

    setIsPublishing(false)
  }

  const handleComment = async () => {
    if (!account) {
      setStatus({ type: 'error', message: m.editor_status_keychain_required() })
      return
    }

    if (!commentPayload.parentAuthor.trim() || !commentPayload.parentPermlink.trim()) {
      setStatus({
        type: 'error',
        message: m.prototype_comment_parent_required(),
      })
      return
    }

    if (!commentPayload.body.trim()) {
      setStatus({ type: 'error', message: m.prototype_comment_body_required() })
      return
    }

    setIsCommenting(true)
    setStatus(null)

    const operations = buildCommentOperations({
      author: account,
      parentAuthor: commentPayload.parentAuthor.trim(),
      parentPermlink: commentPayload.parentPermlink.trim(),
      body: commentPayload.body.trim(),
    })

    const response = await broadcastOperations(account, operations, 'Posting')

    if (response.success) {
      setStatus({
        type: 'success',
        message: m.prototype_comment_broadcasted(),
      })
      setCommentPayload((prev) => ({ ...prev, body: '' }))
    } else {
      setStatus({
        type: 'error',
        message: response.message ?? m.prototype_comment_failed(),
      })
    }

    setIsCommenting(false)
  }

  return (
    <Box position="relative" overflow="hidden">
      <Box
        position="absolute"
        inset={0}
        bgGradient="to-b"
        gradientFrom="bg"
        gradientTo="bg.subtle"
        opacity={0.8}
      />
      <Box
        position="absolute"
        right="-200px"
        top="120px"
        w="420px"
        h="420px"
        borderRadius="50%"
        bg="purple.muted"
        opacity={0.35}
        filter="blur(10px)"
      />
      <Container maxW="1200px" py={{ base: 10, md: 16 }} position="relative">
        <Stack gap={10}>
          <Stack gap={4} maxW="720px">
            <Badge w="fit-content" colorPalette="orange" variant="subtle">
              {m.prototype_badge()}
            </Badge>
            <Heading size="2xl" letterSpacing="-0.02em">
              {m.prototype_heading()}
            </Heading>
            <Text fontSize="lg" color="fg.muted">
              {m.prototype_subtitle()}
            </Text>
          </Stack>

          {!keychainDetected && (
            <Alert
              status="warning"
              variant="subtle"
              colorPalette="orange"
            >
              {m.prototype_keychain_missing()}
            </Alert>
          )}

          {status && (
            <Alert
              status={status.type}
              variant="subtle"
              borderStartColor="colorPalette.solid"
              bg="bg.subtle"
              colorPalette={statusPalette}
            >

{status.message}
            </Alert>
          )}

          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} alignItems="start">
            <Box
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="24px"
              p={6}
              boxShadow="lg"
            >
              <Stack gap={4}>
                <Heading size="md">{m.prototype_connect_heading()}</Heading>
                <Text color="fg.muted" fontSize="sm">
                  {m.prototype_connect_description()}
                </Text>
                <Input
                  placeholder={m.prototype_connect_username_placeholder()}
                  value={loginName}
                  onChange={(event) => setLoginName(event.target.value)}
                  bg="bg.muted"
                  borderColor="border"
                />
                <Button
                  colorPalette="orange"
                  onClick={handleLogin}
                  loading={isConnecting}
                  disabled={!keychainDetected}
                >
                  {m.prototype_connect_button()}
                </Button>
                {accountReady && account && (
                  <Box
                    bg="bg.muted"
                    borderRadius="16px"
                    p={4}
                    border="1px solid"
                    borderColor="border"
                  >
                    <Flex justify="space-between" align="center">
                      <Stack gap={1}>
                        <Text fontWeight="600">@{account}</Text>
                        <Text fontSize="xs" color="fg.muted">
                          {profileLoading
                            ? m.prototype_profile_loading()
                            : profile
                            ? m.prototype_profile_posts({ count: profile.post_count ?? 0 })
                            : m.prototype_profile_unavailable()}
                        </Text>
                      </Stack>
                      <Button size="sm" variant="outline" onClick={handleLogout}>
                        {m.prototype_sign_out()}
                      </Button>
                    </Flex>
                  </Box>
                )}
              </Stack>
            </Box>

            <Box
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="24px"
              p={6}
              gridColumn={{ base: 'auto', lg: 'span 2' }}
            >
              <Stack gap={6}>
                <Box>
                  <Heading size="md">{m.prototype_publish_heading()}</Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {m.prototype_publish_description()}
                  </Text>
                </Box>

                <Stack gap={4}>
                  <Input
                    placeholder={m.prototype_post_title_placeholder()}
                    value={postPayload.title}
                    onChange={(event) =>
                      setPostPayload((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    bg="bg.muted"
                    borderColor="border"
                  />
                  <Textarea
                    placeholder={m.prototype_post_body_placeholder()}
                    value={postPayload.body}
                    onChange={(event) =>
                      setPostPayload((prev) => ({
                        ...prev,
                        body: event.target.value,
                      }))
                    }
                    rows={9}
                    bg="bg.muted"
                    borderColor="border"
                  />
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Input
                      placeholder={m.prototype_post_tags_placeholder()}
                      value={postPayload.tags}
                      onChange={(event) =>
                        setPostPayload((prev) => ({
                          ...prev,
                          tags: event.target.value,
                        }))
                      }
                      bg="bg.muted"
                      borderColor="border"
                    />
                    <Input
                      placeholder={m.prototype_post_community_placeholder()}
                      value={postPayload.community}
                      onChange={(event) =>
                        setPostPayload((prev) => ({
                          ...prev,
                          community: event.target.value,
                        }))
                      }
                      bg="bg.muted"
                      borderColor="border"
                    />
                  </SimpleGrid>
                  <HStack gap={2} flexWrap="wrap">
                    {tagPreview.length === 0 ? (
                      <Text fontSize="xs" color="fg.muted">
                        {m.prototype_post_tags_helper()}
                      </Text>
                    ) : (
                      tagPreview.map((tag) => (
                        <Badge key={tag} colorPalette="orange" variant="subtle">
                          #{tag}
                        </Badge>
                      ))
                    )}
                  </HStack>
                  <Button
                    colorPalette="orange"
                    onClick={handlePublish}
                    loading={isPublishing}
                    disabled={!keychainDetected}
                  >
                    {m.prototype_publish_button()}
                </Button>
                </Stack>
              </Stack>
            </Box>

            <Box
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="24px"
              p={6}
            >
              <Stack gap={4}>
                <Heading size="md">{m.prototype_comment_heading()}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  {m.prototype_comment_description()}
                </Text>
                <Input
                  placeholder={m.prototype_comment_parent_author_placeholder()}
                  value={commentPayload.parentAuthor}
                  onChange={(event) =>
                    setCommentPayload((prev) => ({
                      ...prev,
                      parentAuthor: event.target.value,
                    }))
                  }
                  bg="bg.muted"
                  borderColor="border"
                />
                <Input
                  placeholder={m.prototype_comment_parent_permlink_placeholder()}
                  value={commentPayload.parentPermlink}
                  onChange={(event) =>
                    setCommentPayload((prev) => ({
                      ...prev,
                      parentPermlink: event.target.value,
                    }))
                  }
                  bg="bg.muted"
                  borderColor="border"
                />
                <Textarea
                  placeholder={m.prototype_comment_body_placeholder()}
                  value={commentPayload.body}
                  onChange={(event) =>
                    setCommentPayload((prev) => ({
                      ...prev,
                      body: event.target.value,
                    }))
                  }
                  rows={6}
                  bg="bg.muted"
                  borderColor="border"
                />
                <Button
                  variant="outline"
                  borderColor="border"
                  onClick={handleComment}
                  loading={isCommenting}
                  disabled={!keychainDetected}
                >
                  {m.prototype_comment_button()}
                </Button>
              </Stack>
            </Box>

            <Box
              bg="bg.panel"
              border="1px solid"
              borderColor="border"
              borderRadius="24px"
              p={6}
            >
              <Stack gap={3}>
                <Heading size="md">{m.prototype_keychain_status_heading()}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  {m.prototype_keychain_status_description()}
                </Text>
                <Flex align="center" gap={3}>
                  {keychainDetected ? (
                    <Badge colorPalette="green" variant="subtle">
                      {m.prototype_keychain_detected()}
                    </Badge>
                  ) : (
                    <Badge colorPalette="red" variant="subtle">
                      {m.prototype_keychain_missing_badge()}
                    </Badge>
                  )}
                  {!accountReady && <Spinner size="sm" color="fg.muted" />}
                </Flex>
              </Stack>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  )
}
