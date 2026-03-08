import { Box, HStack, Image, Stack, Text } from '@chakra-ui/react'
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
}: ProfileBannerProps) => {
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
      <Box position="relative" h={`${coverHeight}px`} bg="bg.muted">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            w="full"
            h="full"
            objectFit="cover"
          />
        ) : null}
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-b, rgba(0,0,0,0.1), rgba(0,0,0,0.4))"
        />
      </Box>
      <Stack px={{ base: 4, md: 5 }} pb={{ base: 4, md: 5 }} mt={-8} gap={3}>
        <HStack justify="space-between" align="end" wrap="wrap" gap={3}>
          <HStack align="end" gap={3}>
            <Box
              border="3px solid"
              borderColor="bg.panel"
              borderRadius="full"
              bg="bg.panel"
            >
              <Avatar
                size={avatarSize}
                src={avatarUrl}
                name={avatarName}
              />
            </Box>
            <Stack gap={1}>
              {typeof title === 'string' ? (
                <Text fontSize={isCompact ? 'md' : 'lg'} fontWeight="700">
                  {title}
                </Text>
              ) : (
                title
              )}
              {subtitle ? (
                <Text fontSize="sm" color="fg.muted">
                  {subtitle}
                </Text>
              ) : null}
            </Stack>
          </HStack>
          {actions ? <Box>{actions}</Box> : null}
        </HStack>
        {description ? (
          <Text fontSize="sm" color="fg.muted">
            {description}
          </Text>
        ) : null}
        {meta ? <Box>{meta}</Box> : null}
      </Stack>
    </Box>
  )
}

export default ProfileBanner
