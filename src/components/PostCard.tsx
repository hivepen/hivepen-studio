import { Clock, MoreHorizontal } from 'lucide-react'
import {
  Box,
  Card,
  HStack,
  IconButton,
  ScrollArea,
  Show,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import type {
  StackProps} from '@chakra-ui/react';
import type { ReactNode } from 'react'
import type { VoteDetail } from '@/lib/posts/votes'
import useTitleMeta from '@/hooks/useTitleMeta'
import PostTag from '@/components/PostTag'
import PostPayoutBadge from '@/components/posts/PostPayoutBadge'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { isCommunityId } from '@/lib/hive/community'
import AccountAvatar from '@/components/AccountAvatar'
import PostActions from '@/features/posts/PostActions'

export type PostCardProps = {
  title: string
  author: string
  community?: string
  communityId?: string
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
  actions?: ReactNode
}

export default function PostCard({
  title,
  author,
  community,
  communityId,
  summary,
  tags = [],
  createdAt,
  coverUrl,
  payout,
  permlink,
  comments,
  votes,
}: PostCardProps) {
  const titleMeta = useTitleMeta(title)
  const filteredTags = tags.filter((tag) => !isCommunityId(tag))
  const tagItems = filteredTags
  const hasPayout = Boolean(payout?.pending || payout?.total)

  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      flexDirection={{ base: 'column', lg: 'row' }}
      bg="bg.panel"
      borderColor="border"
      borderWidth="1px"
      borderRadius="12px"
    >
      <Stack flex="1" minW={0} gap={0}>
        <Card.Header pb={0} px={{ base: 3, md: 4 }} pt={{ base: 3, md: 4 }}>
          <HStack gap={3} align="start">
            <PostCardAuthor {...{ author, createdAt, community }} />
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
            <ScrollArea.Root>
              <HStack gap={2} maxH={10} wrap="wrap" overflowX="auto">
                {tagItems.map((tag) => (
                  <PostTag key={tag} tag={tag} />
                ))}
              </HStack>
            </ScrollArea.Root>
          ) : null}
        </Card.Body> */}

        <Card.Footer pt={2} px={{ base: 3, md: 4 }} pb={{ base: 3, md: 4 }}>
          <PostCardActions
            author={author}
            permlink={permlink}
            comments={comments}
            votes={votes}
            hasPayout={hasPayout}
            payout={payout}
          />
        </Card.Footer>
      </Stack>
    </Card.Root>
  )
}

function PostCardAuthor({
  author,
  createdAt,
  community,
}: {
  author: string
  createdAt?: string
  community?: string
}) {
  return (
    <HStack flex="1" justify="space-between" align="start" gap={3} wrap="wrap">
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
                <Show when={community}>
                  <Text>on {community}</Text>
                  {/* TODO: link to community. Needs communityId */}
                  <Text color="colorPalette.muted" fontWeight={900}>
                    ·
                  </Text>
                </Show>
                <Text>{createdAt}</Text>
                {/* TODO: display formated time ago instead of created at raw date. Use a library or method with good support for i18n */}
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

function PostCardMedia({
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
  votes,
  hasPayout,
  payout,
  ...props
}: {
  author: string
  permlink?: string
  comments?: number
  votes?: number
  hasPayout: boolean
  payout?: {
    pending: string
    total: string
  }
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
          voteCount={votes}
          variant="card"
        />
      </HStack>
      <HStack gap={2}>
        {hasPayout && (
          <PostPayoutBadge
            author={author}
            permlink={permlink}
            payout={payout}
          />
        )}
      </HStack>
    </HStack>
  )
}
