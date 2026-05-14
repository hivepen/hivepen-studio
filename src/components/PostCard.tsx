import { Clock, MoreHorizontal } from 'lucide-react'
import {
  Box,
  Card,
  HStack,
  IconButton,
  Show,
  Stack,
  Text,
} from '@chakra-ui/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import type { StackProps } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import type { VoteDetail } from '@/lib/posts/votes'
import type { CommunityInfo } from '@/features/posts/usePostQuery'
import useTitleMeta from '@/hooks/useTitleMeta'
import PostPayoutBadge from '@/components/posts/PostPayoutBadge'
import { toaster } from '@/components/ui/toaster'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import AccountAvatar from '@/components/AccountAvatar'
import PostActions, {
  type VoteFeedbackOrigin,
} from '@/features/posts/PostActions'
import { formatFullDateTime, formatRelativeTime } from '@/lib/i18n/relativeTime'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

export type PostCardProps = {
  title: string
  author: string
  community?: PostCommunityRef
  summary?: string
  tags?: Array<string>
  createdAt?: string
  comments?: number
  votes?: number
  app?: string
  payout?: {
    pending: string
    total: string
  }
  voteDetails?: Array<VoteDetail>
  coverUrl?: string
  permlink?: string
}

export type PostCommunityRef = {
  id?: string
  label: string
}

export default function PostCard({
  title,
  author,
  community,
  summary,
  createdAt,
  coverUrl,
  payout,
  permlink,
  comments,
  voteDetails,
  votes,
}: PostCardProps) {
  const titleMeta = useTitleMeta(title)
  const hasPayout = Boolean(payout?.pending || payout?.total)
  const [isVotePressing, setIsVotePressing] = useState(false)
  const [isVoteCelebrating, setIsVoteCelebrating] = useState(false)
  const [localVoteDelta, setLocalVoteDelta] = useState(0)
  const [rippleOrigin, setRippleOrigin] = useState<{
    x: number
    y: number
  } | null>(null)
  const [voteCelebrationKey, setVoteCelebrationKey] = useState(0)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const celebrationTimeoutRef = useRef<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const resolvedVotes = (votes ?? 0) + localVoteDelta

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  const resolveRippleOrigin = ({ clientX, clientY }: VoteFeedbackOrigin) => {
    const bounds = cardRef.current?.getBoundingClientRect()
    if (!bounds) return

    setRippleOrigin({
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    })
  }

  const handleVotePressStart = (origin: VoteFeedbackOrigin) => {
    resolveRippleOrigin(origin)
    setIsVotePressing(true)
  }

  const handleVotePressEnd = () => {
    setIsVotePressing(false)
  }

  const handleVoteSuccess = () => {
    setIsVotePressing(false)
    setLocalVoteDelta((current) => current + 1)
    setVoteCelebrationKey((current) => current + 1)
    setIsVoteCelebrating(true)

    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current)
    }

    celebrationTimeoutRef.current = window.setTimeout(() => {
      setIsVoteCelebrating(false)
      celebrationTimeoutRef.current = null
    }, 700)
  }

  const handleVoteError = (message: string) => {
    setIsVotePressing(false)
    setIsVoteCelebrating(false)
    toaster.error({
      closable: true,
      description: message || m.post_actions_vote_failed(),
    })
  }

  return (
    <Card.Root
      ref={cardRef}
      variant="outline"
      overflow="hidden"
      position="relative"
      flexDirection={{ base: 'column', lg: 'row' }}
      bg="bg.panel"
      borderColor="border"
      borderWidth="1px"
      borderRadius="12px"
    >
      <AnimatePresence>
        {isVoteCelebrating && rippleOrigin ? (
          <Box
            key={voteCelebrationKey}
            asChild
            position="absolute"
            inset={0}
            pointerEvents="none"
            zIndex={0}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Box
                asChild
                position="absolute"
                inset={0}
                bg="colorPalette.subtle"
                colorPalette="green"
              >
                <motion.div
                  animate={{
                    opacity: prefersReducedMotion ? [0, 0.12, 0] : [0, 0.18, 0],
                  }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              </Box>
              {!prefersReducedMotion ? (
                <Box asChild position="absolute" left={0} top={0}>
                  <motion.div
                    initial={{
                      height: 18,
                      opacity: 0.32,
                      width: 18,
                      x: rippleOrigin.x - 9,
                      y: rippleOrigin.y - 9,
                    }}
                    animate={{
                      height: 420,
                      opacity: 0,
                      width: 420,
                      x: rippleOrigin.x - 210,
                      y: rippleOrigin.y - 210,
                    }}
                    exit={{ opacity: 0 }}
                    style={{
                      background:
                        'radial-gradient(circle, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0.14) 38%, rgba(34,197,94,0) 72%)',
                      borderRadius: '9999px',
                    }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </Box>
              ) : null}
            </motion.div>
          </Box>
        ) : null}
      </AnimatePresence>

      <Stack flex="1" minW={0} gap={0} position="relative" zIndex={1}>
        <Card.Header pb={0} px={{ base: 3, md: 4 }} pt={{ base: 3, md: 4 }}>
          <HStack gap={3} align="start">
            <PostHeadInfo
              {...{ author, createdAt, community }}
              style={{ viewTransitionName: `post-head-${permlink}` }}
            />
          </HStack>
        </Card.Header>

        <Card.Body pt={2} px={{ base: 3, md: 4 }} pb={2}>
          <HStack>
            <PostCardMedia
              author={author}
              coverUrl={coverUrl}
              shortTitle={titleMeta.shortTitle}
            />
            <Stack gap={3}>
              {permlink ? (
                <Link
                  to="/post/$author/$permlink"
                  params={{ author, permlink }}
                  style={{ textDecoration: 'none' }}
                >
                  <Text
                    fontWeight="bold"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    lineClamp={2}
                    _hover={{ textDecoration: 'underline' }}
                    style={{ viewTransitionName: `post-title-${permlink}` }}
                  >
                    {title}
                  </Text>
                </Link>
              ) : (
                <Text
                  fontWeight="bold"
                  fontSize={{ base: 'lg', md: 'xl' }}
                  lineClamp={2}
                >
                  {title}
                </Text>
              )}
              {summary ? (
                <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                  {/* //fontSize="sm" color="fg.muted" lineClamp={2}*/}
                  {summary}
                </Text>
              ) : null}
            </Stack>
          </HStack>
        </Card.Body>

        {/* for reference only, the tags should be visible in the post details, not all tags in the post card as Badges <Card.Body pt={0} px={{ base: 3, md: 4 }} pb={2}>
          {tagItems.length > 0 ? (
            <Badge>
              <HStack gap={2} maxH={10} wrap="wrap" overflowX="auto">
                {tagItems.map((tag) => (
                  <PostTag key={tag} tag={tag} />
                ))}
              </HStack>
            </Badge>
          ) : null}
        </Card.Body> */}

        <Card.Footer pt={2} px={{ base: 3, md: 4 }} pb={{ base: 3, md: 4 }}>
          <PostCardActions
            author={author}
            permlink={permlink}
            comments={comments}
            voteDetails={voteDetails}
            votes={resolvedVotes}
            hasPayout={hasPayout}
            payout={payout}
            cardVoteState={{
              celebrateKey: voteCelebrationKey,
              isCelebrating: isVoteCelebrating,
              isPressing: isVotePressing,
            }}
            onVoteError={handleVoteError}
            onVotePressEnd={handleVotePressEnd}
            onVotePressStart={handleVotePressStart}
            onVoteSuccess={handleVoteSuccess}
          />
        </Card.Footer>
      </Stack>
    </Card.Root>
  )
}

export function PostHeadInfo({
  author,
  createdAt,
  community,
  ...props
}: {
  author: string
  createdAt?: string
  community?: CommunityInfo | PostCommunityRef
} & StackProps) {
  const locale = getLocale()
  const relativeCreatedAt = createdAt
    ? formatRelativeTime(createdAt, locale)
    : undefined
  const createdAtLabel = createdAt ? formatFullDateTime(createdAt, locale) : ''
  const communityRef =
    community && 'label' in community
      ? community
      : community
        ? {
            id: community.id,
            label: community.name ?? community.id,
          }
        : undefined

  return (
    <HStack
      flex="1"
      justify="space-between"
      align="start"
      gap={3}
      wrap="wrap"
      {...props}
    >
      <HStack gap={3} align="start" minW={0}>
        <AccountAvatar
          username={author}
          size="lg"
          boxSize={10}
          borderRadius="full"
        />
        <Stack gap={0} minW={0}>
          <Link
            to="/$accountname"
            params={{ accountname: `@${author}` }}
            style={{ textDecoration: 'none' }}
          >
            <Text
              fontWeight="semibold"
              fontSize="sm"
              _hover={{ textDecoration: 'underline' }}
              textTransform="capitalize" // TODO: change by the actual account display name
            >
              {author}
            </Text>
          </Link>
          <HStack gap={1} color="fg.muted" fontSize="xs">
            {createdAt ? (
              <>
                <Show when={author}>
                  <Text>@{author}</Text>
                  <Text color="colorPalette.muted" fontWeight={900}>
                    ·
                  </Text>
                </Show>
                <Show when={communityRef?.label}>
                  {communityRef?.id ? (
                    <Link
                      to="/communities/$communityId"
                      params={{ communityId: communityRef.id }}
                      style={{ textDecoration: 'none' }}
                    >
                      <Text as="span" _hover={{ textDecoration: 'underline' }}>
                        on {communityRef.label}
                      </Text>
                    </Link>
                  ) : (
                    <Text>on {communityRef?.label}</Text>
                  )}
                  <Text color="colorPalette.muted" fontWeight={900}>
                    ·
                  </Text>
                </Show>
                <Text title={createdAtLabel}>{relativeCreatedAt || createdAt}</Text>
              </>
            ) : null}
          </HStack>
        </Stack>
      </HStack>

      <HStack gap={2} display={{ base: 'none', sm: 'flex' }}>
        <HStack
          gap={1}
          px={3}
          py={1}
          bg="bg.subtle"
          borderRadius="lg"
          color="fg.muted"
          fontSize="xs"
          fontWeight="medium"
        >
          <Clock size="3" />
          <Text>1 min read</Text>
        </HStack>
        <IconButton
          aria-label="More options"
          variant="ghost"
          size="sm"
          rounded="full"
        >
          <MoreHorizontal size={16} />
        </IconButton>
      </HStack>
    </HStack>
  )
}

export function PostCardMedia({
  author,
  coverUrl,
  shortTitle,
}: {
  author: string
  coverUrl?: string
  shortTitle?: string
}) {
  const hasImage = Boolean(coverUrl)

  return (
    <Box
      height={{ base: 'clamp(4rem,10vh,5.5rem)' }}
      aspectRatio={4 / 3}
      bg="bg.subtle"
      position="relative"
      overflow="hidden"
      flexShrink={0}
      borderRadius="md"
    >
      {hasImage ? (
        <Box
          position="absolute"
          inset={0}
          backgroundImage={`url(${coverUrl})`}
          backgroundSize="contain"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
        />
      ) : (
        <>
          <Box
            position="absolute"
            inset={0}
            opacity={0.15}
            backgroundImage={`url(${getHiveAvatarUrl(author)})`}
            backgroundSize="140%"
            backgroundPosition="center"
            filter="grayscale(1)"
            mixBlendMode="multiply"
          />
          <Text
            position="absolute"
            top="5%"
            right="8%"
            fontSize="xs"
            fontWeight="700"
            color="fg.muted"
            opacity={0.5}
          >
            {author}
          </Text>
          <Text
            fontSize={{ base: 'xs' }}
            fontWeight="600"
            letterSpacing="0.06em"
            textTransform="uppercase"
            color="fg.muted"
            zIndex={1}
            px={3}
            textAlign="center"
            textWrap="balance"
            lineClamp={2}
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {shortTitle || ''}
          </Text>
        </>
      )}
    </Box>
  )
}

function PostCardActions({
  author,
  permlink,
  comments,
  voteDetails,
  votes,
  hasPayout,
  payout,
  cardVoteState,
  onVoteError,
  onVotePressEnd,
  onVotePressStart,
  onVoteSuccess,
  ...props
}: {
  author: string
  permlink?: string
  comments?: number
  voteDetails?: Array<VoteDetail>
  votes?: number
  hasPayout: boolean
  payout?: {
    pending: string
    total: string
  }
  cardVoteState: {
    celebrateKey: number
    isCelebrating: boolean
    isPressing: boolean
  }
  onVoteError: (message: string) => void
  onVotePressEnd: () => void
  onVotePressStart: (origin: VoteFeedbackOrigin) => void
  onVoteSuccess: () => void
} & StackProps) {
  return (
    <HStack
      justify="space-between"
      align="center"
      wrap="wrap"
      gap={2}
      w="full"
      {...props}
    >
      <HStack gap={1}>
        <PostActions
          author={author}
          permlink={permlink ?? ''}
          commentCount={comments}
          voteDetails={voteDetails}
          cardVoteState={cardVoteState}
          onVoteError={onVoteError}
          onVotePressEnd={onVotePressEnd}
          onVotePressStart={onVotePressStart}
          onVoteSuccess={onVoteSuccess}
          voteCount={votes}
          variant="card"
        />
      </HStack>
      <HStack gap={2}>
        {hasPayout && (
          <PostPayoutBadge
            author={author}
            celebrateKey={cardVoteState.celebrateKey}
            permlink={permlink}
            payout={payout}
          />
        )}
      </HStack>
    </HStack>
  )
}
