import { useQuery } from '@tanstack/react-query'
import { fetchWalletOverview } from '@/lib/hive/wallet'

const normalizeWalletAccount = (value?: string | null) =>
  (value ?? '').trim().replace(/^@/, '').toLowerCase()

export default function useWalletQuery(account?: string | null) {
  const normalized = normalizeWalletAccount(account)

  return useQuery({
    queryKey: ['wallet', normalized],
    enabled: normalized.length > 0,
    queryFn: () => fetchWalletOverview(normalized),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })
}
