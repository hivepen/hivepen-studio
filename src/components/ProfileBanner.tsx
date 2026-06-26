import { Box, HStack, Image, Show, Stack, Text } from '@chakra-ui/react'
import type { BoxProps } from '@chakra-ui/react'
import { Avatar } from '@/components/ui/avatar'

type ProfileBannerProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  description?: React.ReactNode
  avatarUrl?: string
  avatarName?: string
  coverUrl?: string
  actions?: React.ReactNode
  meta?: React.ReactNode
  size?: 'default' | 'compact'
}

const ProfileBanner = ({
  title,
  subtitle,
  description,
  avatarUrl,
  avatarName,
  coverUrl,
  actions,
  meta,
  size = 'default',
}: ProfileBannerProps & BoxProps) => {
  const isCompact = size === 'compact'
  const coverHeight = isCompact ? 120 : 160
  const avatarSize = isCompact ? 'lg' : 'xl'

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="16px"
      bg="bg.panel"
      overflow="hidden"
    >
      <Box position="relative" h={`${coverHeight}px`} bg="bg.muted" zIndex={0}>
        {coverUrl ? (
          <>
            <Image src={coverUrl} alt="" w="full" h="full" objectFit="cover" />
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              h="100px"
            // bg="linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)"
            />
          </>
        ) : null}
      </Box>
      <Stack
        px={{ base: 4, md: 5 }}
        pb={{ base: 4, md: 5 }}
        mt={-8}
        gap={3}
        position="relative"
        zIndex={1}
      >
        <HStack justify="space-between" align="end" wrap="wrap" gap={3}>
          <HStack align="end" gap={3}>
            <Box
              border="3px solid"
              borderColor="bg.panel"
              borderRadius="full"
              bg="bg.panel"
              position="relative"
              _after={{
                content: '""',
                position: 'absolute',
                top: '45%',
                right: '-3',
                width: '9px',
                height: '8px',
                borderRadius: '0 0 0 6px',
                boxShadow: '-3px 3px 0 0 var(--chakra-colors-bg-panel)',
              }}
              _before={{
                content: '""',
                position: 'absolute',
                top: '45%',
                left: '-3',
                width: '9px',
                height: '8px',
                borderRadius: '0 0 6px 0',
                boxShadow: '3px 3px 0 0 var(--chakra-colors-bg-panel)',
              }}
            >
              <Avatar size={avatarSize} src={avatarUrl} name={avatarName} />
            </Box>
          </HStack>
          <Show when={actions}>
            <Box position="relative" _after={{
              content: '""',
              position: 'absolute',
              top: '39%',
              right: '-2',
              width: '9px',
              height: '8px',
              borderRadius: '0 0 0 6px',
              boxShadow: '-3px 3px 0 0 var(--chakra-colors-bg-panel)',
            }}
              _before={{
                content: '""',
                position: 'absolute',
                top: '39%',
                left: '-2',
                width: '9px',
                height: '8px',
                borderRadius: '0 0 6px 0',
                boxShadow: '3px 3px 0 0 var(--chakra-colors-bg-panel)',
              }}
            >
              {actions}
            </Box>
          </Show>
        </HStack>
        <Stack gap={0}>
          {' '}
          <Show when={typeof title === 'string'} fallback={title}>
            {() => (
              <Text fontSize={isCompact ? 'md' : 'lg'} fontWeight="700">
                {title}
              </Text>
            )}
          </Show>
          <Show when={subtitle}>
            <Text
              fontSize="xs"
              color="fg.muted"
              _hover={{ textDecoration: 'underline', cursor: 'pointer' }}
              title={`Copy "${subtitle}" to clipboard`}
              onClick={() => navigator.clipboard.writeText(String(subtitle))}
            >
              {subtitle}
            </Text>
          </Show>
        </Stack>
        <Show when={description}>
          <Text fontSize="sm" color="fg.muted" textWrap="wrap">
            {description}
          </Text>
        </Show>
        <Show when={meta}>
          <Box>{meta}</Box>
        </Show>
      </Stack>
    </Box>
  )
}

export default ProfileBanner
