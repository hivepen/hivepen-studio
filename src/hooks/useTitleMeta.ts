import { useMemo } from 'react'
import { getTitleMeta } from '@/lib/posts/titleMeta'

export default function useTitleMeta(title: string, maxLength?: number) {
  return useMemo(() => getTitleMeta(title, maxLength), [title, maxLength])
}
