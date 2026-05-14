import type { PostCardProps, PostCommunityRef } from '@/components/PostCard'
import type { CommunityId } from '@/features/posts/usePostQuery'
import type { PostSearchResult } from '@/lib/hive/search'
import { m } from '@/paraglide/messages'

type CommunityReferenceInput = {
  communityId?: string
  communityTitle?: string
  communityInfo?: {
    id: CommunityId
    name?: string
  }
}

export function resolvePostCommunity(
  post: CommunityReferenceInput,
): PostCommunityRef | undefined {
  const id = post.communityInfo?.id ?? post.communityId
  const label =
    post.communityTitle?.trim() || post.communityInfo?.name?.trim() || id?.trim()

  if (!id && !label) {
    return undefined
  }

  return {
    id,
    label: label ?? id ?? '',
  }
}

export function mapSearchResultToPostCardProps(
  post: PostSearchResult,
): PostCardProps {
  return {
    title: post.title || m.post_untitled(),
    author: post.author,
    community: resolvePostCommunity(post),
    tags: post.tags,
    summary: post.summary,
    coverUrl: post.coverUrl,
    app: post.app,
    createdAt: post.created,
    permlink: post.permlink,
    votes: post.votes,
    voteDetails: post.voteDetails,
    comments: post.comments,
    payout: post.payout,
  }
}
