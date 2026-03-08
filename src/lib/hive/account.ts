import { searchAccount } from '@ecency/sdk'
import { hiveClient } from './client'

export type HiveAccountSearchResult = {
  name: string
  full_name: string
  about: string
  reputation: number
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
  const lookupFromCondenser = async () => {
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

  if (typeof window !== 'undefined') {
    return lookupFromCondenser()
  }

  try {
    return await searchAccount(query, limit, 0)
  } catch {
    return lookupFromCondenser()
  }
}
