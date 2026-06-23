import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const CustomArticleIcon = createIcon({
  displayName: 'CustomArticleIcon',
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
      <path d="M13 18 L8 18" />
      <path d="M15 10 L9 10" />
      <path d="M15 6 A1 1 0 0 1 16 7" />
      <path d="M16 14 L8 14" />
      <path d="M16 7 L16 9" />
      <path d="M16 9 A1 1 0 0 1 15 10" />
      <path d="M18 2 L6 2" />
      <path d="M18 22 A2 2 0 0 0 20 20" />
      <path d="M20 20 L20 4" />
      <path d="M20 4 A2 2 0 0 0 18 2" />
      <path d="M4 20.002 A2 2 0 0 0 6 22" />
      <path d="M4 4 L4 20" />
      <path d="M6 2 A2 2 0 0 0 4 4" />
      <path d="M6 22 L18 22" />
      <path d="M8 7 A1 1 0 0 1 9 6" />
      <path d="M8 9 L8 7" />
      <path d="M9 10 A1 1 0 0 1 8 9" />
      <path d="M9 6 L15 6" />
    </>
  ),
})

export type CustomArticleIconProps = Omit<IconProps, 'children'>

export default CustomArticleIcon

