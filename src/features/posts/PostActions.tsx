import {
  Collapsible,
  HStack,
  IconButton,
  Text,
  Textarea,
  Group,
  Button,
  Stack,
  Popover,
  Portal,
  Skeleton,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ArrowBigUp, MessageCircle, Send } from 'lucide-react'
import useVotePost from '@/features/posts/useVotePost'
import useCommentPost from '@/features/posts/useCommentPost'
import usePostVoteDetails from '@/hooks/usePostVoteDetails'
import { Avatar } from '@/components/ui/avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import {
  formatVotePercent,
  sortVoteDetailsByPercent,
} from '@/lib/posts/votes'

export default function PostActions({
  author,
  permlink,
  voteCount,
  commentCount,
  onVoteSuccess,
  onCommentSuccess,
}: {
  author: string
  permlink: string
  voteCount?: number
  commentCount?: number
  onVoteSuccess?: () => void
  onCommentSuccess?: () => void
}) {
  const [commentBody, setCommentBody] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const [votesOpen, setVotesOpen] = useState(false)
  const [shouldFetchVotes, setShouldFetchVotes] = useState(false)
  const vote = useVotePost({ author, permlink })
  const comment = useCommentPost({ parentAuthor: author, parentPermlink: permlink })
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
  const resolvedCommentCount = typeof commentCount === 'number' ? commentCount : 0

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

  return (
    <Stack>
      <HStack gap={2} wrap="wrap" justify="end">
        <Group attached borderRadius="full">
          <Tooltip content="Upvote">
            <IconButton
              size="md"
              variant="ghost"
              rounded="full"
              onClick={handleVote}
              loading={vote.isVoting}
              aria-label="Upvote"
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
                h="auto"
                minW="auto"
                aria-label="See voters"
                onMouseEnter={() => setShouldFetchVotes(true)}
                onFocus={() => setShouldFetchVotes(true)}
                onClick={() => setShouldFetchVotes(true)}
              >
                <Text fontSize="sm" fontWeight="600">
                  {resolvedVoteCount}
                </Text>
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
                  <Stack gap={3}>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Voters
                    </Text>
                    {voteDetailsLoading ? (
                      <Stack gap={2}>
                        <Skeleton height="12px" />
                        <Skeleton height="12px" />
                        <Skeleton height="12px" />
                      </Stack>
                    ) : hasVoteDetails ? (
                      <Stack gap={2}>
                        {sortedVoteDetails.map((vote) => (
                          <HStack
                            key={vote.account}
                            justify="space-between"
                            gap={4}
                          >
                            <HStack gap={2} minW={0}>
                              <Avatar
                                size="xs"
                                name={vote.account}
                                src={getHiveAvatarUrl(vote.account)}
                              />
                              <Text
                                fontSize="sm"
                                fontWeight="500"
                                lineClamp={1}
                              >
                                @{vote.account}
                              </Text>
                            </HStack>
                            <Text
                              fontSize="xs"
                              color="fg.muted"
                              fontWeight="600"
                            >
                              {formatVotePercent(vote.percent)}
                            </Text>
                          </HStack>
                        ))}
                      </Stack>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        No votes yet.
                      </Text>
                    )}
                  </Stack>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </Group>

        <Tooltip content="Comment">
          <Button
            size="md"
            variant="ghost"
            rounded="full"
            aria-label="Comment"
            onClick={() => setCommentOpen((prev) => !prev)}
            gap={2}
          >
            <MessageCircle size={16} />
            <Text fontSize="xs" fontWeight="600" color="fg.muted">
              {resolvedCommentCount}
            </Text>
          </Button>
        </Tooltip>

      </HStack>

      {(vote.error || comment.error) && (
        <Text fontSize="xs" color="fg.error" mt={2}>
          {vote.error ?? comment.error}
        </Text>
      )}
      {(vote.success || comment.success) && (
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {vote.success ? 'Vote sent.' : 'Comment published.'}
        </Text>
      )}

      <Collapsible.Root open={commentOpen}>
        <Collapsible.Content>
          <HStack mt={3} align="start">
            <Textarea
              variant="subtle"
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Write a reply"
              size="sm"
            />
            <HStack mt={2} justify="flex-end">
              <Tooltip content="Publish comment">
                <IconButton
                  size="sm"
                  variant="ghost"
                  rounded="full"
                  onClick={handleComment}
                  loading={comment.isCommenting}
                  aria-label="Publish comment"
                  _hover={{ bg: 'bg.subtle', borderColor: 'border.muted' }}
                >
                  <Send size={16} />
                </IconButton>
              </Tooltip>
            </HStack>
          </HStack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Stack>
  )
}
