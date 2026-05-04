import type { CommunityId } from "@/features/posts/usePostQuery"

export type PostSearchResult = {
  author: string
  permlink: string
  title: string
  created: string
  tags: Array<string>
  communityId?: string
  communityTitle?: string
  communityInfo?: { id: CommunityId; name: string }
  summary?: string
  coverUrl?: string
  images: Array<string>
  app?: string
  votes?: number
  comments?: number
  payout?: {
    pending: string
    total: string
  }
}

export type RankedSort =
  | 'trending'
  | 'hot'
  | 'created'
  | 'promoted'
  | 'payout'
  | 'payout_comments'
  | 'muted'
