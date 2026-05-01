import {
  Box,
  Card,
  HStack,
  ScrollArea,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import type {
  BoxProps} from '@chakra-ui/react';
import type { ReactNode } from 'react'
import type { VoteDetail } from '@/lib/posts/votes'
import useTitleMeta from '@/hooks/useTitleMeta'
import PostTag from '@/components/PostTag'
import PostPayoutBadge from '@/components/posts/PostPayoutBadge'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { isCommunityId } from '@/lib/hive/community'

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
  actions,
  app,
  payout,
  permlink,
}: PostCardProps) {
  const titleMeta = useTitleMeta(title)
  const filteredTags = tags.filter((tag) => !isCommunityId(tag))
  const tagItems = filteredTags
  const hasPayout = Boolean(payout?.pending || payout?.total)
  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      flexDirection={{ base: 'column', '2xl': 'row' }}
    >
      <PostCardMedia
        flex="1"
        overflow="hidden"
        author={author}
        coverUrl={coverUrl}
        shortTitle={titleMeta.shortTitle}
      />
      <Stack flex="2" minW={0}>
        <Card.Header pb={0}>
          <HStack gap={2} color="fg.muted" fontSize="sm" wrap="wrap">
            {community ? (
              <Link
                to="/communities/$communityId"
                params={{ communityId: communityId ?? community }}
                style={{ textDecoration: 'none' }}
              >
                <Text as="span" _hover={{ textDecoration: 'underline' }}>
                  {community}
                </Text>
              </Link>
            ) : null}
            <Link
              to="/$accountname"
              params={{ accountname: `@${author}` }}
              style={{ textDecoration: 'none' }}
            >
              <Text as="span" _hover={{ textDecoration: 'underline' }}>
                @{author}
              </Text>
            </Link>
            {createdAt ? <Text as="span">· {createdAt}</Text> : null}
          </HStack>
        </Card.Header>
        <Card.Body gap={3} pt={3}>
          {permlink ? (
            <Link
              to="/post/$author/$permlink"
              params={{ author, permlink }}
              style={{ textDecoration: 'none' }}
            >
              <Card.Title _hover={{ textDecoration: 'underline' }}>
                {title}
              </Card.Title>
            </Link>
          ) : (
            <Card.Title>{title}</Card.Title>
          )}
          {summary ? (
            <Card.Description lineClamp={2}>{summary}</Card.Description>
          ) : null}
          {tagItems.length > 0 ? (
            <ScrollArea.Root>
              <HStack gap={2} maxH={12} wrap="wrap" overflowX="auto">
                {tagItems.map((tag) => (
                  <PostTag key={tag} tag={tag} />
                ))}
              </HStack>
            </ScrollArea.Root>
          ) : null}
        </Card.Body>
        <Card.Footer pt={3}>
          <HStack
            gap={3}
            w="full"
            justify="space-between"
            align="center"
            wrap="wrap"
          >
            {hasPayout ? (
              <PostPayoutBadge
                author={author}
                permlink={permlink}
                payout={payout}
              />
            ) : (
              <Box />
            )}
            {actions}
          </HStack>
        </Card.Footer>
      </Stack>
    </Card.Root>
  )
}

function PostCardMedia({
  author,
  coverUrl,
  shortTitle,
  ...props
}: {
  author: string
  coverUrl?: string
  shortTitle?: string
} & BoxProps) {
  return (
    <Box
      w={{ base: '100%', '2xl': '200px' }}
      h={{ base: '180px', '2xl': '100%' }}
      minH="180px"
      bg="bg.subtle"
      backgroundImage={coverUrl ? `url(${coverUrl})` : undefined}
      transition="backgrounds"
      transitionDuration="0.2s"
      backgroundSize="contain"
      backgroundRepeat="no-repeat"
      backgroundPosition="0% 50%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
      {...props}
    >
      {!coverUrl && (
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
            top={3}
            right={3}
            fontSize="xs"
            fontWeight="700"
            color="fg.muted"
            opacity={0.5}
          >
            {author}
          </Text>
          <Text
            fontSize="sm"
            fontWeight="600"
            letterSpacing="0.06em"
            textTransform="uppercase"
            color="fg.muted"
            zIndex={1}
            px={3}
            textAlign="center"
            textWrap="balance"
            lineClamp={2}
          >
            {shortTitle || ''}
          </Text>
        </>
      )}
    </Box>
  )
}
