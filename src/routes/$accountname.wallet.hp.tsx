import { createFileRoute } from '@tanstack/react-router'
import { WalletAssetRouteScreen } from '@/features/wallet/walletScreens'

export const Route = createFileRoute('/$accountname/wallet/hp')({
  component: WalletHivePowerPage,
})

function WalletHivePowerPage() {
  const { accountname } = Route.useParams()

  return <WalletAssetRouteScreen accountname={accountname} assetId="hp" />
}
