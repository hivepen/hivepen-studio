import { createIcon } from '@chakra-ui/react'
import type { IconProps } from '@chakra-ui/react'

/**
 * @component @name HiveIconLucide
 * @description Custom Lucide-style SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgMjF2LThhMSAxIDAgMCAwLTEtMWgtNGExIDEgMCAwIDAtMSAxdjgiIC8+CiAgPHBhdGggZD0iTTMgMTBhMiAyIDAgMCAxIC43MDktMS41MjhsNy02YTIgMiAwIDAgMSAyLjU4MiAwbDcgNkEyIDIgMCAwIDEgMjEgMTB2OWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/house
 * @see https://lucide.dev/guide/packages/lucide-react - Documentation
 *
 * @param {Object} props - Lucide icons props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 *
 */
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
