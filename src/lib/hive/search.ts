export type SearchResult = {
  author: string
  permlink: string
  title: string
  created: string
  tags: Array<string>
  community?: string
  communityTitle?: string
  summary?: string
  coverUrl?: string
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
