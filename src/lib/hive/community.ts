import { hiveClient } from './client'

export type HiveCommunityDetail = {
  id: string | number
  name: string
  title?: string
  about?: string
  lang?: string
  subscribers?: number
  created_at?: string
  is_nsfw?: boolean
  description?: string
}

export const fetchCommunity = async (name: string) => {
  const result = (await hiveClient.hivemind.getCommunity({
    name,
  })) as HiveCommunityDetail | null

  return result ?? null
}

/**
 * Checks if a string is a valid Hive community ID.
 * @param id The string to check.
 * @returns True if the string is a valid Hive community ID, false otherwise.
 */
export const isCommunityId = (id: string): boolean =>
  id.trim().toLowerCase().startsWith('hive-') //TODO: check length, maybe use regex to match the pattern: hive-10053 hive-161155 hive-<any number>
