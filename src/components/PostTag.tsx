import { Badge, Icon, Text } from '@chakra-ui/react'
import { Avatar } from './ui/avatar'
import type {
  TagStyle} from '@/lib/posts/tagColorConfig';
import {
  TAG_PALETTES,
  TAG_REGEX_OVERRIDES,
  TAG_STYLE_MAP,
  simpleicon
} from '@/lib/posts/tagColorConfig'

function hashStringToIndex(value: string, modulo: number) {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash) % modulo
}

export default function PostTag({ tag }: { tag: string }) {
  const normalizedTag = tag.trim().replace(/^#/, '')
  const normalizedKey = normalizedTag.toLowerCase()
  const mappedStyle = TAG_STYLE_MAP[normalizedKey]
  const regexStyle = TAG_REGEX_OVERRIDES.find(({ pattern }) =>
    pattern.test(normalizedTag),
  )?.style
  const resolvedStyle: TagStyle | undefined = mappedStyle ?? regexStyle
  if (resolvedStyle) resolvedStyle.avatar ||= simpleicon(normalizedKey)
  const colorPalette =
    resolvedStyle?.colorPalette ??
    TAG_PALETTES[hashStringToIndex(normalizedTag, TAG_PALETTES.length)]
  const usesCustomColors =
    (!resolvedStyle?.avatar && Boolean(resolvedStyle?.bg)) ||
    Boolean(resolvedStyle?.fg) ||
    Boolean(resolvedStyle?.border)
  const TagIcon = resolvedStyle?.icon
  return (
    <Badge
      variant="subtle"
      colorPalette={usesCustomColors ? undefined : colorPalette}
      bg={resolvedStyle?.bg}
      color={resolvedStyle?.fg}
      borderColor={resolvedStyle?.border}
      borderWidth={resolvedStyle?.border ? '1px' : undefined}
      textTransform="uppercase"
    >
      {/* <img width="16" height="16" src={simpleicon(normalizedTag)} /> */}
      {TagIcon ? (
        <Icon size="xs">
          <TagIcon />
        </Icon>
      ) : resolvedStyle?.avatar ? (
        <Avatar
          shape="square"
          bg="none"
          src={resolvedStyle?.avatar ?? simpleicon(normalizedTag)}
          size="xs"
          w={3}
          h={3}
          fallback={
            <Text color={resolvedStyle?.fg} opacity={0.4}>
              #
            </Text>
          }
        />
      ) : (
        <Text color={resolvedStyle?.fg} opacity={0.4}>
          #
        </Text>
      )}
      {normalizedTag}
    </Badge>
  )
}
