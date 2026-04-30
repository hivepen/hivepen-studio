import { Client } from '@hiveio/dhive'

const DEFAULT_NODES = ['https://api.hive.blog', 'https://api.deathwing.me']

export const hiveClient = new Client(DEFAULT_NODES)

export const fetchAccount = async (username: string) => {
  const [account] = await hiveClient.database.getAccounts([username])
  return account ?? null
}

export const toHiveText = (value: unknown) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

export type HiveCommunity = {
  id: string | number
  name: string
  title?: string
  about?: string
}

export const getCommunityIdentifier = (
  community: Pick<HiveCommunity, 'id' | 'name'>
) => toHiveText(community.name) || toHiveText(community.id)

export const getCommunityLabel = (
  community: Pick<HiveCommunity, 'id' | 'name' | 'title'>
) => toHiveText(community.title) || getCommunityIdentifier(community)

export const listCommunities = async (query: string) => {
  const result = await hiveClient.hivemind.listCommunities({
    limit: 20,
    query,
  })
  return (result ?? []) as HiveCommunity[]
}
