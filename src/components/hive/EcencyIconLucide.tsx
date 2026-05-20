import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const EcencyIconLucide = createIcon({
  displayName: 'EcencyIconLucide',
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
      <path d="M10 8.5 A2.5 2.5 0 0 0 8.5 11" />
      <path d="M11.516 13.446 A4.5 4.5 0 0 0 15.417 8" />
      <path d="M15.417 8 A6 6 0 0 0 3.503 9.181" />
      <path d="M15.5 20.5 A5.5 5.5 0 0 0 15.5 9.5" />
      <path d="M3.5 18 A2.5 2.5 0 0 0 5.5 20.5" />
      <path d="M3.503 9.181 L3.5 18" />
      <path d="M5.5 20.5 L15.5 20.5" />
      <path d="M8.5 11 A3.15 3.15 0 0 0 11.516 13.446" />
    </>
  ),
})

export type EcencyIconLucideProps = Omit<IconProps, 'children'>

export default EcencyIconLucide
