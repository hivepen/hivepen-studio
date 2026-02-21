import {
  Box,
  Collapsible,
  HStack,
  IconButton,
  Tooltip,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useState } from 'react'
import { ArrowBigUp, MessageCircle, Send } from 'lucide-react'
import useVotePost from '@/features/posts/useVotePost'
import useCommentPost from '@/features/posts/useCommentPost'

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
  const vote = useVotePost({ author, permlink })
  const comment = useCommentPost({ parentAuthor: author, parentPermlink: permlink })

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
    <Box>
      <HStack gap={2} wrap="wrap">
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <IconButton
              size="sm"
              variant="outline"
              onClick={handleVote}
              loading={vote.isVoting}
              aria-label="Upvote"
              _hover={{ bg: 'bg.subtle', borderColor: 'border.muted' }}
            >
              <ArrowBigUp size={16} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Upvote</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
        {voteCount !== undefined ? (
          <Box
            px={2.5}
            py={1}
            borderRadius="full"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border"
          >
            <Text fontSize="xs" fontWeight="600" color="fg.muted">
              {voteCount}
            </Text>
          </Box>
        ) : null}
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <IconButton
              size="sm"
              variant="outline"
              onClick={() => setCommentOpen((prev) => !prev)}
              aria-label="Comment"
              _hover={{ bg: 'bg.subtle', borderColor: 'border.muted' }}
            >
              <MessageCircle size={16} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Comment</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
        {commentCount !== undefined ? (
          <Box
            px={2.5}
            py={1}
            borderRadius="full"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border"
          >
            <Text fontSize="xs" fontWeight="600" color="fg.muted">
              {commentCount}
            </Text>
          </Box>
        ) : null}
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
          <Box mt={3}>
            <Textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Write a reply"
              bg="bg.panel"
              borderColor="border"
              size="sm"
            />
            <HStack mt={2} justify="flex-end">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <IconButton
                    size="sm"
                    colorPalette="gray"
                    onClick={handleComment}
                    loading={comment.isCommenting}
                    aria-label="Publish comment"
                    _hover={{ bg: 'bg.subtle', borderColor: 'border.muted' }}
                  >
                    <Send size={16} />
                  </IconButton>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>Publish comment</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            </HStack>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  )
}
