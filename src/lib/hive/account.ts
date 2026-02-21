import { fetchAccount, hiveClient } from './client'

export type HiveAccountProfile = {
  name: string
  about?: string
  location?: string
  website?: string
  profileImage?: string
  coverImage?: string
  reputation?: number
  postCount?: number
  followerCount?: number
  followingCount?: number
}

const parseProfile = (account: any): HiveAccountProfile | null => {
  if (!account) return null
  let metadata: any = {}
  try {
    metadata =
      typeof account.posting_json_metadata === 'string'
        ? JSON.parse(account.posting_json_metadata)
        : account.posting_json_metadata || {}
  } catch {
    metadata = {}
  }
  const profile = metadata?.profile ?? {}

  return {
    name: account.name,
    about: profile.about,
    location: profile.location,
    website: profile.website,
    profileImage: profile.profile_image,
    coverImage: profile.cover_image,
    reputation: account.reputation ? Number(account.reputation) : undefined,
    postCount: account.post_count ? Number(account.post_count) : undefined,
  }
}

export const getAccountProfile = async (username: string) => {
  const account = await fetchAccount(username)
  if (!account) return null
  let followCounts: { followerCount?: number; followingCount?: number } = {}
  try {
    const counts = (await hiveClient.call('condenser_api', 'get_follow_count', [
      username,
    ])) as { follower_count?: number; following_count?: number }
    followCounts = {
      followerCount:
        typeof counts?.follower_count === 'number' ? counts.follower_count : undefined,
      followingCount:
        typeof counts?.following_count === 'number' ? counts.following_count : undefined,
    }
  } catch {
    followCounts = {}
  }
  return { ...parseProfile(account), ...followCounts }
}
