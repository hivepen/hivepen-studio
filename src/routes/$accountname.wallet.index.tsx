import { createFileRoute } from '@tanstack/react-router'
import { WalletHomeRouteScreen } from '@/features/wallet/walletScreens'

export const Route = createFileRoute('/$accountname/wallet/')({
  component: WalletPage,
})

function WalletPage() {
  const { accountname } = Route.useParams()

  return <WalletHomeRouteScreen accountname={accountname} />
}
