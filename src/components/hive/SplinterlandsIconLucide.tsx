import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const SplinterlandsIconLucide = createIcon({
  displayName: 'SplinterlandsIconLucide',
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
      <path d="M 11.5 21 L 9.5 16.5" />
      <path d="M 12.5 21 L 14.5 16.5" />
      <path d="M 14.5 16.5 L 17 21" />
      <path d="M 17 21 L 19 14.5" />
      <path d="M 7 21 L 5 14.5" />
      <path d="M 9.5 16.5 L 7 21" />
      <path d="m11.5 3-2 4.5L7 3 5 9.5 3.5 4A3 3 0 0 1 5 3h14a3 3 0 0 1 1.5 1L19 9.5 17 3l-2.5 4.5-2-4.5" />
      <path d="M19 14.5 L20.5 20" />
      <path d="M19 21 A3 3 0 0 0 20.5 20" />
      <path d="M19 21 L5 21" />
      <path d="M3.5 20 A3 3 0 0 0 5 21" />
      <path d="M5 14.5 L3.5 20" />
    </>
  ),
})

export type SplinterlandsIconLucideProps = Omit<IconProps, 'children'>

export default SplinterlandsIconLucide
