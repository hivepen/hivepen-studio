import { hiveClient } from './client'

type RawComment = {
  author: string
  permlink: string
  body?: string
  created: string
  depth?: number
  json_metadata?: string | { tags?: Array<string> }
}

export type HiveComment = {
  author: string
  permlink: string
  body: string
  created: string
}

export async function fetchPostComments({
  author,
  permlink,
}: {
  author: string
  permlink: string
}): Promise<Array<HiveComment>> {
  const result = (await hiveClient.database.call('get_content_replies', [
    author,
    permlink,
  ])) as Array<RawComment>

  return (result ?? []).map((comment) => ({
    author: comment.author,
    permlink: comment.permlink,
    body: comment.body ?? '',
    created: comment.created,
  }))
}
