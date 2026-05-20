import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const LiketuIconLucide = createIcon({
  displayName: 'LiketuIconLucide',
  viewBox: '0 0 24 24',
  defaultProps: {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  path: (
    <>
      <path d="M 10.5 14 L 16.5 14" />
      <path d="M 10.5 7 A1 1 0 0 0 9.5 8" />
      <path d="M 13.5 17 A1 1 0 0 0 14.5 16" />
      <path d="M 16.5 14 A1 1 0 0 0 17.5 13" />
      <path d="M 17.5 7 L 10.5 7" />
      <path d="M 6.5 11 L 6.5 21" />
      <path d="M 6.5 17 L 13.5 17" />
      <path d="M 6.5 21 L 9 17" />
      <path d="M 7.5 10 A1 1 0 0 0 6.5 11" />
      <path d="M 9.5 13 A1 1 0 0 0 10.5 14" />
      <path d="M 9.5 8 L 9.5 13" />
      <path d="M14.5 16 L14.5 14" />
      <path d="M17.5 13 L17.5 3" />
      <path d="M17.5 3 L15 7" />
      <path d="M9.5 10 L7.5 10" />
    </>
  ),
})

export const LiketuIconLucide2 = createIcon({
  displayName: 'LiketuIconLucideVariant',
  viewBox: '0 0 24 24',
  defaultProps: {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  path: (
    <>
      <path d="M 10.5 14 L 16.5 14" />
      <path d="M 10.5 7 A1 1 0 0 0 9.5 8" />
      <path d="M 16.5 14 A1 1 0 0 0 17.5 13" />
      <path d="M 17.5 7 L 10.5 7" />
      <path d="M 9.5 13 A1 1 0 0 0 10.5 14" />
      <path d="M 9.5 8 L 9.5 13" />
      <path d="M17.5 13 L17.5 3" />
      <path d="M17.5 3 L15 7" />
      <path d="M6.5 17h7a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v10L9 17" />
    </>
  ),
})


export type LiketuIconLucideProps = Omit<IconProps, 'children'>

export default LiketuIconLucide
