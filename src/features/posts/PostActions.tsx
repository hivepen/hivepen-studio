import {
  Box,
  Button,
  Collapsible,
  For,
  Group,
  HStack,
  Icon,
  IconButton,
  Popover,
  Portal,
  Skeleton,
  Slider,
  Stack,
  Text,
  Textarea,
  Wrap,
} from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ChevronUp,
  MessageCircle,
  Ruler,
  Send,
  SlidersHorizontal,
  ThumbsUp,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useHiveWallet } from '@/components/auth/HiveWalletProvider'
import useVotePost from '@/features/posts/useVotePost'
import useCommentPost from '@/features/posts/useCommentPost'
import usePostVoteDetails from '@/hooks/usePostVoteDetails'
import { Tooltip } from '@/components/ui/tooltip'
import type { VoteDetail } from '@/lib/posts/votes'
import { formatVotePercent, sortVoteDetailsByPercent } from '@/lib/posts/votes'
import { m } from '@/paraglide/messages'
import AccountAvatar from '@/components/AccountAvatar'

export type VoteFeedbackOrigin = {
  clientX: number
  clientY: number
}

export default function PostActions({
  author,
  permlink,
  voteCount,
  voteDetails,
  commentCount,
  onVoteSuccess,
  onCommentSuccess,
  onVotePressStart,
  onVotePressEnd,
  onVoteError,
  cardVoteState,
  variant = 'detail',
}: {
  author: string
  permlink: string
  voteCount?: number
  voteDetails?: Array<VoteDetail>
  commentCount?: number
  onVoteSuccess?: () => void
  onCommentSuccess?: () => void
  onVotePressStart?: (origin: VoteFeedbackOrigin) => void
  onVotePressEnd?: () => void
  onVoteError?: (message: string) => void
  cardVoteState?: {
    celebrateKey: number
    isCelebrating: boolean
    isPressing: boolean
  }
  variant?: 'detail' | 'card'
}) {
  const DEFAULT_VOTE_PERCENT = 10
  const DEFAULT_VOTE_STEP = 5
  const HOLD_TO_OPEN_DELAY_MS = 280
  const isCard = variant === 'card'
  const [commentBody, setCommentBody] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const [votesOpen, setVotesOpen] = useState(false)
  const [customVoteOpen, setCustomVoteOpen] = useState(false)
  const [customVotePercent, setCustomVotePercent] =
    useState(DEFAULT_VOTE_PERCENT)
  const [customVoteStep, setCustomVoteStep] = useState<1 | 5>(DEFAULT_VOTE_STEP)
  const [shouldFetchVotes, setShouldFetchVotes] = useState(false)
  const [isVoteButtonCelebrating, setIsVoteButtonCelebrating] = useState(false)
  const celebrationTimeoutRef = useRef<number | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const preventQuickVoteRef = useRef(false)
  const voteSliderThumbRef = useRef<HTMLDivElement | null>(null)
  const voteButtonRef = useRef<HTMLButtonElement | null>(null)
  const voteController = useVotePost({ author, permlink })
  const { activeAccount } = useHiveWallet()
  const prefersReducedMotion = useReducedMotion()
  const [didVoteLocally, setDidVoteLocally] = useState(false)
  const comment = useCommentPost({
    parentAuthor: author,
    parentPermlink: permlink,
  })
  const normalizedActiveAccount = activeAccount?.trim().toLowerCase() ?? null
  const { voteDetails: resolvedVoteDetails, loading: voteDetailsLoading } =
    usePostVoteDetails({
      author,
      permlink,
      enabled: shouldFetchVotes || Boolean(normalizedActiveAccount),
      initialVoteDetails: voteDetails,
    })
  const sortedVoteDetails = resolvedVoteDetails.length
    ? sortVoteDetailsByPercent(resolvedVoteDetails)
    : []
  const hasVoteDetails = sortedVoteDetails.length > 0
  const resolvedVoteCount =
    typeof voteCount === 'number'
      ? voteCount
      : hasVoteDetails
        ? sortedVoteDetails.length
        : 0
  const resolvedCommentCount =
    typeof commentCount === 'number' ? commentCount : 0
  const hasActiveUserVoted = Boolean(
    normalizedActiveAccount &&
    (didVoteLocally ||
      resolvedVoteDetails.some(
        (voteEntry) =>
          voteEntry.account.trim().toLowerCase() === normalizedActiveAccount &&
          voteEntry.percent > 0,
      )),
  )

  const resolveVoteOrigin = (element?: HTMLElement | null) => {
    const target = element ?? voteButtonRef.current
    if (!target) return

    const bounds = target.getBoundingClientRect()
    return {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    } satisfies VoteFeedbackOrigin
  }

  const handleComment = async () => {
    const response = await comment.comment(commentBody)
    if (response.success) {
      setCommentBody('')
      setCommentOpen(false)
      onCommentSuccess?.()
    }
  }

  const submitVote = async (weightPercent: number) => {
    const response = await voteController.vote(weightPercent)
    if (response.success) {
      setDidVoteLocally(true)
      setCustomVoteOpen(false)
      onVotePressEnd?.()
      onVoteSuccess?.()
    } else {
      onVotePressEnd?.()
      onVoteError?.(response.error ?? m.post_actions_vote_failed())
    }
  }

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const openCustomVote = () => {
    clearHoldTimer()
    preventQuickVoteRef.current = true
    onVotePressEnd?.()
    setCustomVoteOpen(true)
  }

  const handleVotePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (voteController.isVoting || customVoteOpen) return
    clearHoldTimer()
    preventQuickVoteRef.current = false
    onVotePressStart?.(
      resolveVoteOrigin(event.currentTarget) ?? {
        clientX: event.clientX,
        clientY: event.clientY,
      },
    )
    holdTimerRef.current = window.setTimeout(() => {
      openCustomVote()
    }, HOLD_TO_OPEN_DELAY_MS)
  }

  const handleVotePointerEnd = () => {
    clearHoldTimer()
    onVotePressEnd?.()
  }

  const handleQuickVote = async (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (customVoteOpen) {
      setCustomVoteOpen(false)
      preventQuickVoteRef.current = false
      onVotePressEnd?.()
      return
    }

    if (preventQuickVoteRef.current) {
      preventQuickVoteRef.current = false
      return
    }

    if (!cardVoteState?.isPressing) {
      onVotePressStart?.(
        resolveVoteOrigin(event.currentTarget) ?? {
          clientX: event.clientX,
          clientY: event.clientY,
        },
      )
    }

    await submitVote(DEFAULT_VOTE_PERCENT)
  }

  const handleCustomVote = async () => {
    await submitVote(customVotePercent)
  }

  const toggleCustomVoteStep = () => {
    setCustomVoteStep((currentStep) => {
      if (currentStep === 5) return 1
      setCustomVotePercent((currentPercent) =>
        Math.max(DEFAULT_VOTE_STEP, Math.round(currentPercent / 5) * 5),
      )
      return 5
    })
  }

  useEffect(() => {
    return () => clearHoldTimer()
  }, [])

  useEffect(() => {
    setDidVoteLocally(false)
  }, [author, permlink, normalizedActiveAccount])

  useEffect(() => {
    if (!cardVoteState?.celebrateKey) return

    setIsVoteButtonCelebrating(true)
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current)
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setIsVoteButtonCelebrating(false)
      celebrationTimeoutRef.current = null
    }, 450)
  }, [cardVoteState?.celebrateKey])

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  const voteButtonScale = prefersReducedMotion
    ? 1
    : isVoteButtonCelebrating
      ? [1, 1.16, 0.96, 1]
      : cardVoteState?.isPressing
        ? 0.92
        : 1

  const voteButtonRotate =
    prefersReducedMotion || !isVoteButtonCelebrating ? 0 : [0, -8, 6, 0]

  const commentForm = (
    <Stack gap={3}>
      <Textarea
        variant="subtle"
        value={commentBody}
        onChange={(event) => setCommentBody(event.target.value)}
        placeholder={m.post_actions_reply_placeholder()}
        size="sm"
      />
      <HStack justify="flex-end">
        <Tooltip content={m.post_actions_publish_comment()}>
          <IconButton
            size="sm"
            variant="ghost"
            rounded="full"
            onClick={handleComment}
            loading={comment.isCommenting}
            aria-label={m.post_actions_publish_comment()}
            _hover={{ bg: 'bg.subtle', borderColor: 'border.muted' }}
          >
            <Send size={16} />
          </IconButton>
        </Tooltip>
      </HStack>
      {isCard && comment.error && (
        <Text fontSize="xs" color="fg.error">
          {comment.error}
        </Text>
      )}
      {isCard && comment.success && (
        <Text fontSize="xs" color="fg.muted">
          {m.post_actions_comment_published()}
        </Text>
      )}
    </Stack>
  )

  return (
    <Stack>
      <HStack gap={2} wrap="wrap" justify="end">
        <Group attached borderRadius="full">
          <Popover.Root
            open={customVoteOpen}
            onOpenChange={(details) => {
              setCustomVoteOpen(details.open)
              if (!details.open) {
                preventQuickVoteRef.current = false
              }
            }}
            initialFocusEl={() => voteSliderThumbRef.current}
            lazyMount
            unmountOnExit
            positioning={{ placement: 'top-start', offset: { mainAxis: 8 } }}
          >
            <Popover.Anchor asChild>
              <Box asChild display="inline-flex">
                <motion.div
                  animate={{
                    rotate: voteButtonRotate,
                    scale: voteButtonScale,
                  }}
                  transition={{
                    duration: isVoteButtonCelebrating ? 0.45 : 0.18,
                    ease: isVoteButtonCelebrating ? 'easeOut' : 'easeInOut',
                    type: 'spring',
                    stiffness: 360,
                    damping: 22,
                  }}
                >
                  <IconButton
                    ref={voteButtonRef}
                    size="md"
                    variant={hasActiveUserVoted ? 'solid' : 'ghost'}
                    colorPalette="gray"
                    rounded="full"
                    onPointerDown={handleVotePointerDown}
                    onPointerUp={handleVotePointerEnd}
                    onPointerCancel={handleVotePointerEnd}
                    onClick={handleQuickVote}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      openCustomVote()
                    }}
                    loading={voteController.isVoting}
                    aria-label={m.post_actions_upvote()}
                  >
                    <Icon as={ChevronUp} strokeWidth={3} />
                  </IconButton>
                </motion.div>
              </Box>
            </Popover.Anchor>
            <Portal>
              <Popover.Positioner>
                <Popover.Content
                  bg="bg.panel"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="16px"
                  boxShadow="lg"
                  p={3}
                  width="288px"
                >
                  <Stack gap={3} colorPalette="green">
                    <HStack justify="space-between" align="start" gap={3}>
                      <Stack gap={0}>
                        <Text
                          color="fg.muted"
                          fontSize="xs"
                          fontWeight="600"
                          letterSpacing="0.08em"
                          textTransform="uppercase"
                        >
                          {m.post_actions_upvote()}
                        </Text>
                        <Text
                          color="colorPalette.fg"
                          fontSize="2xl"
                          fontWeight="700"
                          lineHeight="1"
                        >
                          {customVotePercent}%
                        </Text>
                      </Stack>
                      <Tooltip
                        content={
                          customVoteStep === 5
                            ? 'Switch to 1% steps'
                            : 'Switch to 5% steps'
                        }
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          colorPalette="gray"
                          onClick={toggleCustomVoteStep}
                          gap={2}
                          px={3}
                        >
                          <Text fontSize="xs" fontWeight="600">
                            {customVoteStep}% {m.ui_slider_step()}
                          </Text>
                        </Button>
                      </Tooltip>
                    </HStack>

                    <Slider.Root
                      aria-label={['Vote percentage']}
                      colorPalette="green"
                      min={customVoteStep}
                      max={100}
                      step={customVoteStep}
                      size="sm"
                      value={[customVotePercent]}
                      onValueChange={(details) =>
                        setCustomVotePercent(
                          details.value[0] ?? DEFAULT_VOTE_PERCENT,
                        )
                      }
                    >
                      <Slider.Control>
                        <Slider.Track bg="colorPalette.subtle">
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumb index={0} ref={voteSliderThumbRef}>
                          <Slider.HiddenInput />
                        </Slider.Thumb>
                      </Slider.Control>
                    </Slider.Root>

                    <Button
                      loading={voteController.isVoting}
                      onClick={handleCustomVote}
                      width="full"
                      colorPalette="gray"
                    >
                      <Icon as={ThumbsUp} />
                      {m.post_actions_upvote()} {customVotePercent}%
                    </Button>
                  </Stack>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
          <Popover.Root
            open={votesOpen}
            onOpenChange={(details) => setVotesOpen(details.open)}
            positioning={{ placement: 'top-start' }}
          >
            <Popover.Trigger asChild>
              <Button
                variant="ghost"
                size="sm"
                px={2}
                aria-label={m.post_actions_see_voters()}
                onMouseEnter={() => setShouldFetchVotes(true)}
                onFocus={() => setShouldFetchVotes(true)}
                onClick={() => setShouldFetchVotes(true)}
                fontSize="sm"
                fontWeight="600"
              >
                {resolvedVoteCount}
              </Button>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content
                  bg="bg.panel"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="12px"
                  p={3}
                  minW="240px"
                  maxW="280px"
                  maxH="240px"
                  overflowY="auto"
                  boxShadow="lg"
                >
                  <Stack>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      {m.post_actions_voters()}
                    </Text>
                    {voteDetailsLoading ? (
                      <Stack gap={2}>
                        <Skeleton height="12px" />
                        <Skeleton height="12px" />
                        <Skeleton height="12px" />
                      </Stack>
                    ) : hasVoteDetails ? (
                      <Stack gap={2}>
                        {/* participation decorative chart (no details) */}
                        <HStack overflow="hidden" rounded="lg" gap="0.5">
                          <For
                            each={sortedVoteDetails.filter(
                              (voteEntry) => voteEntry.percent >= 1,
                            )}
                          >
                            {(voteEntry) => (
                              <HStack
                                h={1}
                                bg="colorPalette.subtle"
                                gap="0.5"
                                colorPalette={'gray'}
                                key={voteEntry.account}
                                rounded="xs"
                                width={formatVotePercent(voteEntry.percent)}
                              ></HStack>
                            )}
                          </For>
                        </HStack>

                        {/* VOTERS List */}
                        <For
                          each={sortedVoteDetails.filter(
                            (voteEntry) => voteEntry.percent >= 0.1,
                          )}
                        >
                          {(voteEntry) => (
                            <HStack
                              key={voteEntry.account}
                              justify="space-between"
                              gap={4}
                            >
                              <HStack asChild gap={2} minW={0}>
                                <Link
                                  to="/$accountname"
                                  params={{
                                    accountname: `@${voteEntry.account}`,
                                  }}
                                >
                                  <AccountAvatar
                                    size="xs"
                                    boxSize={6}
                                    username={voteEntry.account}
                                  />

                                  <HStack gap="0.5">
                                    <Text
                                      fontWeight="400"
                                      fontSize="xs"
                                      as="span"
                                      color="colorPalette.emphasized"
                                    >
                                      @
                                    </Text>
                                    <Text
                                      as="span"
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      lineClamp={1}
                                    >
                                      {voteEntry.account}
                                    </Text>
                                  </HStack>
                                </Link>
                              </HStack>
                              <Stack gap="0" align="end">
                                <Text
                                  fontSize="xs"
                                  color="fg.muted"
                                  fontWeight="600"
                                >
                                  {formatVotePercent(voteEntry.percent)}
                                </Text>
                                <Box
                                  rounded="full"
                                  me="1"
                                  bg="colorPalette.muted"
                                  h="1"
                                  w={formatVotePercent(voteEntry.percent)}
                                ></Box>
                              </Stack>
                            </HStack>
                          )}
                        </For>
                        <HStack align="center">
                          <Box h={0.5} bg="colorPalette.subtle" flex="1"></Box>
                          <Text color="fg.muted" fontSize="xs">
                            0 - 0.1%
                          </Text>
                        </HStack>
                        <Wrap>
                          <For
                            each={sortedVoteDetails.filter(
                              (voteEntry) => voteEntry.percent <= 0.1,
                            )}
                          >
                            {(voteEntry) => (
                              <Link
                                to="/$accountname"
                                params={{
                                  accountname: `@${voteEntry.account}`,
                                }}
                              >
                                <AccountAvatar
                                  size="xs"
                                  boxSize={6}
                                  username={voteEntry.account}
                                />
                              </Link>
                            )}
                          </For>
                        </Wrap>
                      </Stack>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        {m.post_actions_no_votes()}
                      </Text>
                    )}
                  </Stack>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Group>

        {isCard ? (
          <Popover.Root
            open={commentOpen}
            onOpenChange={(details) => setCommentOpen(details.open)}
            positioning={{ placement: 'top-start' }}
          >
            <Popover.Trigger asChild>
              <Tooltip content={m.post_actions_comment()}>
                <Button
                  size="md"
                  variant="ghost"
                  rounded="full"
                  aria-label={m.post_actions_comment()}
                  gap={2}
                  disabled // TODO: Disabled until a quick popup comment feature is implemented
                >
                  <Icon as={MessageCircle} strokeWidth="3" />
                  <Text fontSize="xs" fontWeight="600" color="fg.muted">
                    {resolvedCommentCount}
                  </Text>
                </Button>
              </Tooltip>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content
                  bg="bg.panel"
                  border="1px solid"
                  borderColor="border"
                  borderRadius="12px"
                  p={3}
                  minW="260px"
                  maxW="320px"
                  boxShadow="lg"
                >
                  {commentForm}
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        ) : (
          <Tooltip content={m.post_actions_comment()}>
            <Button
              size="md"
              variant="ghost"
              rounded="full"
              aria-label={m.post_actions_comment()}
              onClick={() => setCommentOpen((prev) => !prev)}
              gap={2}
            >
              <MessageCircle size={16} />
              <Text fontSize="xs" fontWeight="600" color="fg.muted">
                {resolvedCommentCount}
              </Text>
            </Button>
          </Tooltip>
        )}
      </HStack>

      {!isCard && (
        <>
          {(voteController.error || comment.error) && (
            <Text fontSize="xs" color="fg.error" mt={2}>
              {voteController.error ?? comment.error}
            </Text>
          )}
          {(voteController.success || comment.success) && (
            <Text fontSize="xs" color="fg.muted" mt={2}>
              {voteController.success
                ? m.post_actions_vote_sent()
                : m.post_actions_comment_published()}
            </Text>
          )}
          <Collapsible.Root open={commentOpen}>
            <Collapsible.Content>
              <Box mt={3}>{commentForm}</Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </>
      )}
    </Stack>
  )
}
