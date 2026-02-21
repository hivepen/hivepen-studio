import { Client } from '@hiveio/dhive'

const DEFAULT_NODES = ['https://api.hive.blog', 'https://api.deathwing.me']

export const hiveClient = new Client(DEFAULT_NODES)

export const fetchAccount = async (username: string) => {
  const [account] = await hiveClient.database.getAccounts([username])
  return account ?? null
}

export type HiveCommunity = {
  id: string
  name: string
  title?: string
  about?: string
}

export const listCommunities = async (query: string) => {
  const result = await hiveClient.hivemind.listCommunities({
    limit: 20,
    query,
  })
  return (result ?? []) as HiveCommunity[]
}
