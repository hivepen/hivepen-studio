import { Badge, Box, HStack, Stack, Text } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { ReactNode } from 'react'
import useTitleMeta from '@/hooks/useTitleMeta'
import { getHiveAvatarUrl } from '@/lib/hive/avatars'
import { getInitials, getPlaceholderGradient } from '@/lib/posts/placeholder'

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
  comments,
  votes,
  coverUrl,
  actions,
  permlink,
}: PostCardProps) {
  const titleMeta = useTitleMeta(title)
  const placeholderSeed = `${author}-${titleMeta.cleaned}`
  const placeholderGradient = getPlaceholderGradient(placeholderSeed)
  const authorInitials = getInitials(author)

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="12px"
      bg="bg.panel"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
    >
      <Stack gap={4}>
        <Stack
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 4, lg: 6 }}
          justify="space-between"
          align={{ base: 'stretch', lg: 'flex-start' }}
        >
          <Stack gap={3} flex="1" minW={0}>
            <Stack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                {community ? (
                  <>
                    <Link
                      to="/communities/$communityId"
                      params={{ communityId: communityId ?? community }}
                      style={{ textDecoration: 'none' }}
                    >
                      <Text as="span" _hover={{ textDecoration: 'underline' }}>
                        {community}
                      </Text>
                    </Link>
                    {' · '}
                  </>
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
                {createdAt ? ` · ${createdAt}` : ''}
              </Text>
              {permlink ? (
                <Link
                  to="/post/$author/$permlink"
                  params={{ author, permlink }}
                  style={{ textDecoration: 'none' }}
                >
                  <Text
                    as="span"
                    fontSize="lg"
                    fontWeight="600"
                    _hover={{ textDecoration: 'underline' }}
                  >
                    {title}
                  </Text>
                </Link>
              ) : (
                <Text fontSize="lg" fontWeight="600">
                  {title}
                </Text>
              )}
              {summary ? (
                <Text color="fg.muted" fontSize="sm" lineClamp={2}>
                  {summary}
                </Text>
              ) : null}
            </Stack>

            {tags.length > 0 ? (
              <HStack gap={2} wrap="wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="subtle" colorPalette="gray">
                    #{tag}
                  </Badge>
                ))}
              </HStack>
            ) : null}

            {(votes !== undefined || comments !== undefined) && (
              <HStack gap={4} color="fg.muted" fontSize="sm">
                {votes !== undefined ? <Text>{votes} votes</Text> : null}
                {comments !== undefined ? <Text>{comments} comments</Text> : null}
              </HStack>
            )}
          </Stack>

          <Stack
            align={{ base: 'stretch', lg: 'flex-end' }}
            minW={{ lg: '200px' }}
            gap={3}
          >
            <Box
              w={{ base: '100%', lg: '200px' }}
              h={{ base: '140px', lg: '120px' }}
              borderRadius="12px"
              bg="bg.subtle"
              backgroundImage={coverUrl ? `url(${coverUrl})` : undefined}
              backgroundSize="cover"
              backgroundPosition="center"
              border="1px solid"
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
                    bgGradient={placeholderGradient}
                  />
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
                    {authorInitials}
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
                    {titleMeta.shortTitle || ''}
                  </Text>
                </>
              )}
            </Box>
            {actions ? (
              <Box alignSelf={{ base: 'flex-start', lg: 'flex-end' }}>
                {actions}
              </Box>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}
