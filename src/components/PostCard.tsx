import { Box, Card, HStack, Stack, Text } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { ReactNode } from 'react'
import useTitleMeta from '@/hooks/useTitleMeta'
import PostTag from '@/components/PostTag'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { VoteDetail } from '@/lib/posts/votes'

export type PostCardProps = {
  title: string
  author: string
  community?: string
  communityId?: string
  summary?: string
  tags?: string[]
  createdAt?: string
  comments?: number
  votes?: number
  voteDetails?: VoteDetail[]
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
  permlink,
}: PostCardProps) {
  const titleMeta = useTitleMeta(title)

  return (
    <Card.Root
      variant="outline"
      overflow="hidden"
      flexDirection={{ base: 'column', xl: 'row' }}
    >
      <PostCardMedia
        author={author}
        coverUrl={coverUrl}
        shortTitle={titleMeta.shortTitle}
      />
      <Stack flex="1" minW={0}>
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
              to="/profile/$accountname"
              params={{ accountname: author }}
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
          {tags.length > 0 ? (
            <HStack gap={2} wrap="wrap">
              {tags.map((tag) => (
                <PostTag key={tag} tag={tag} />
              ))}
            </HStack>
          ) : null}
        </Card.Body>
        <Card.Footer pt={3}>{actions}</Card.Footer>
      </Stack>
    </Card.Root>
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
  return (
    <Box
      w={{ base: '100%', xl: '260px' }}
      h={{ base: '180px', xl: '100%' }}
      minH={{ xl: '220px' }}
      bg="bg.subtle"
      backgroundImage={coverUrl ? `url(${coverUrl})` : undefined}
      backgroundSize="cover"
      backgroundPosition="center"
      borderBottom={{ base: '1px solid', xl: 'none' }}
      borderColor="border"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
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
