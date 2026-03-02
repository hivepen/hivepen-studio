import { searchAccount } from '@ecency/sdk'
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

export type HiveAccountSearchResult = {
  name: string
  full_name: string
  about: string
  reputation: number
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

const parseSearchResult = (account: any): HiveAccountSearchResult => {
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
    full_name: profile.name ?? '',
    about: profile.about ?? '',
    reputation: account.reputation ? Number(account.reputation) : 0,
  }
}

export const searchAccounts = async (
  query: string,
  limit = 20
): Promise<HiveAccountSearchResult[]> => {
  if (!query) return []
  try {
    return await searchAccount(query, limit, 0)
  } catch {
    try {
      const names = (await hiveClient.call('condenser_api', 'lookup_accounts', [
        query,
        limit,
      ])) as string[]
      if (!Array.isArray(names) || names.length === 0) return []
      const accounts = await hiveClient.database.getAccounts(names)
      return accounts.map(parseSearchResult)
    } catch {
      return []
    }
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
