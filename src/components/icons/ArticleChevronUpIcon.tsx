import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

const ArticleChevronUp = createIcon({
  displayName: 'ArticleChevronUp',
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
      <path d="M12 21H5.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v8" />
      <path d="m21 18.5-2.146-2.146a1.21 1.21 0 0 0-1.708 0L15 18.5" />
      <path d="M8.5 11h7" />
      <path d="M8.5 7h5" />
    </>
  ),
})

export type ArticleChevronUpProps = Omit<IconProps, 'children'>

export default ArticleChevronUp
