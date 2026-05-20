import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const ActifitIconLucide = createIcon({
  displayName: 'ActifitIconLucide',
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
      <path d="M10.5 13 L3 21" />
      <path d="M11.955 4.682 A7.5 7.5 0 0 0 9.5 2.5" />
      <path d="M13.126 14.72 A8.5 8.5 0 0 0 8.5 11.5" />
      <path d="M13.126 16.28 A1 1 0 0 0 13.126 14.72" />
      <path d="M15 4.499 A1 1 0 0 1 17 4.5" />
      <path d="M16.5 8 A8.5 8.5 0 0 0 17.5 10.446" />
      <path d="M17 4.501 A1 1 0 0 1 15 4.499" />
      <path d="M17.5 10.446 A1.5 1.5 0 0 0 19.5 10.37" />
      <path d="M19.5 10.37 A8.5 8.5 0 0 0 21.996 7.507" />
      <path d="M7.5 3 L6.5 7.5" />
      <path d="M9.01 18.759 A8.5 8.5 0 0 0 13.126 16.28" />
      <path d="M9.5 2.5 A1.51 1.51 0 0 0 7.5 3" />
    </>
  ),
})

export type ActifitIconLucideProps = Omit<IconProps, 'children'>

export default ActifitIconLucide
