import { hiveClient } from './client'

type RawPost = {
  author: string
  permlink: string
  title: string
  body?: string
  created: string
  community?: string
  json_metadata?: string | { tags?: string[] }
  net_votes?: number
  children?: number
  category?: string
}

export type HivePost = {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  community?: string
  tags: string[]
  votes?: number
  comments?: number
  category?: string
}

const parseTags = (metadata: RawPost['json_metadata']) => {
  const parsed =
    typeof metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(metadata)
          } catch {
            return {}
          }
        })()
      : metadata ?? {}

  return Array.isArray(parsed?.tags) ? parsed.tags : []
}

export async function fetchPost({
  author,
  permlink,
}: {
  author: string
  permlink: string
}): Promise<HivePost | null> {
  const post = (await hiveClient.database.call('get_content', [
    author,
    permlink,
  ])) as RawPost | null

  if (!post) {
    return null
  }

  return {
    author: post.author,
    permlink: post.permlink,
    title: post.title,
    body: post.body ?? '',
    created: post.created,
    community: post.community,
    tags: parseTags(post.json_metadata),
    votes: typeof post.net_votes === 'number' ? post.net_votes : undefined,
    comments: typeof post.children === 'number' ? post.children : undefined,
    category: post.category,
  }
}
