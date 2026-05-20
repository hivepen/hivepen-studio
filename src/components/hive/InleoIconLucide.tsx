import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const InleoIconLucide = createIcon({
  displayName: 'InleoIconLucide',
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
      <path d="M10 9 L5.5 7" />
      <path d="M12 15.5 L9.5 13.5" />
      <path d="M14.5 13.5 L12 15.5" />
      <path d="M14.5 13.5 L14 9" />
      <path d="M18.5 7 L14 9" />
      <path d="M18.5 7 L14.5 10" />
      <path d="M2 12 L12 19" />
      <path d="M2 12 L3 6.5" />
      <path d="M20 13 L21 6.5" />
      <path d="M22 12 L12 19" />
      <path d="M22 12 L21 6.5" />
      <path d="M4 13 L3 6.5" />
      <path d="M9.5 10 L5.5 7" />
      <path d="M9.5 13.5 L10 9" />
    </>
  ),
})

export type InleoIconLucideProps = Omit<IconProps, 'children'>

export default InleoIconLucide
