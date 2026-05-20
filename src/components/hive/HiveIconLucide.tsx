import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const HiveIconLucide = createIcon({
  displayName: 'HiveIconLucide',
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
      <path d="M 2.20577 10.9641 A2 2 0 0 0 2.2068 12.96233" />
      <path d="M 21.79423 13.0359 A2 2 0 0 0 21.79323 11.03767" />
      <path d="M12 11 L7 3" />
      <path d="M12 13 A2 2 0 0 0 12 11" />
      <path d="M12 21 L16.5 14" />
      <path d="M16.5 10 L12 3" />
      <path d="M17.5 21 L21.794 13.036" />
      <path d="M2.207 12.962 L7 21" />
      <path d="M21.793 11.038 L17 3" />
      <path d="M7 21 L12 13" />
      <path d="M7 3 L2.206 10.964" />
    </>
  ),
})

export type HiveIconLucideProps = Omit<IconProps, 'children'>

export default HiveIconLucide
