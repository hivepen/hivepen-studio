import { hiveClient } from './client'

export type HiveCommunityDetail = {
  id: string
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
