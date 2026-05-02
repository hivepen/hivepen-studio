import {
  Box,
  Button,
  Collapsible,
  For,
  Group,
  HStack,
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
import { useEffect, useRef, useState } from 'react'
import { ChevronUp, MessageCircle, Send, SlidersHorizontal } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import useVotePost from '@/features/posts/useVotePost'
import useCommentPost from '@/features/posts/useCommentPost'
import usePostVoteDetails from '@/hooks/usePostVoteDetails'
import { Tooltip } from '@/components/ui/tooltip'
import { formatVotePercent, sortVoteDetailsByPercent } from '@/lib/posts/votes'
import { m } from '@/paraglide/messages'
import AccountAvatar from '@/components/AccountAvatar'

export default function PostActions({
  author,
  permlink,
  voteCount,
  commentCount,
  onVoteSuccess,
  onCommentSuccess,
  variant = 'detail',
}: {
  author: string
  permlink: string
  voteCount?: number
  commentCount?: number
  onVoteSuccess?: () => void
  onCommentSuccess?: () => void
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
  const [customVotePercent, setCustomVotePercent] = useState(DEFAULT_VOTE_PERCENT)
  const [customVoteStep, setCustomVoteStep] = useState<1 | 5>(DEFAULT_VOTE_STEP)
  const [shouldFetchVotes, setShouldFetchVotes] = useState(false)
  const holdTimerRef = useRef<number | null>(null)
  const preventQuickVoteRef = useRef(false)
  const voteSliderThumbRef = useRef<HTMLDivElement | null>(null)
  const voteController = useVotePost({ author, permlink })
  const comment = useCommentPost({
    parentAuthor: author,
    parentPermlink: permlink,
  })
  const { voteDetails: resolvedVoteDetails, loading: voteDetailsLoading } =
    usePostVoteDetails({
      author,
      permlink,
      enabled: shouldFetchVotes,
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

  const handleComment = async () => {
    const response = await comment.comment(commentBody)
    if (response.success) {
      setCommentBody('')
      setCommentOpen(false)
      onCommentSuccess?.()
    }
  }

  const handleVote = async () => {
    const response = await vote.vote(100)
    if (response.success) {
      onVoteSuccess?.()
    }
  }

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
      {isCard && (vote.error || comment.error) && (
        <Text fontSize="xs" color="fg.error">
          {vote.error ?? comment.error}
        </Text>
      )}
      {isCard && (vote.success || comment.success) && (
        <Text fontSize="xs" color="fg.muted">
          {vote.success
            ? m.post_actions_vote_sent()
            : m.post_actions_comment_published()}
        </Text>
      )}
    </Stack>
  )

  return (
    <Stack>
      <HStack gap={2} wrap="wrap" justify="end">
        <Group attached borderRadius="full">
          <Tooltip content={m.post_actions_upvote()}>
            <IconButton
              size="md"
              variant="ghost"
              rounded="full"
              onClick={handleVote}
              loading={vote.isVoting}
              aria-label={m.post_actions_upvote()}
            >
              <ArrowBigUp size={16} />
            </IconButton>
          </Tooltip>
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
                            {(vote) => (
                              <HStack
                                h={1}
                                bg="colorPalette.subtle"
                                gap="0.5"
                                colorPalette={'gray'}
                                key={vote.account}
                                rounded="xs"
                                width={formatVotePercent(vote.percent)}
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
                          {(vote) => (
                            <HStack
                              key={vote.account}
                              justify="space-between"
                              gap={4}
                            >
                              <HStack asChild gap={2} minW={0}>
                                <Link
                                  to="/$accountname"
                                  params={{ accountname: `@${vote.account}` }}
                                >
                                  <AccountAvatar
                                    size="xs"
                                    boxSize={6}
                                    username={vote.account}
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
                                      {vote.account}
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
                                  {formatVotePercent(vote.percent)}
                                </Text>
                                <Box
                                  rounded="full"
                                  me="1"
                                  bg="colorPalette.muted"
                                  h="1"
                                  w={formatVotePercent(vote.percent)}
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
                            {(vote) => (
                              <Link
                                to="/$accountname"
                                params={{ accountname: `@${vote.account}` }}
                              >
                                <AccountAvatar
                                  size="xs"
                                  boxSize={6}
                                  username={vote.account}
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
                >
                  <MessageCircle size={16} />
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
          {(vote.error || comment.error) && (
            <Text fontSize="xs" color="fg.error" mt={2}>
              {vote.error ?? comment.error}
            </Text>
          )}
          {(vote.success || comment.success) && (
            <Text fontSize="xs" color="fg.muted" mt={2}>
              {vote.success
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
