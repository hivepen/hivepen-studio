import { createFileRoute } from '@tanstack/react-router'
import { WalletAssetRouteScreen } from '@/features/wallet/walletScreens'

export const Route = createFileRoute('/$accountname/wallet/hbd')({
  component: WalletHiveDollarPage,
})

function WalletHiveDollarPage() {
  const { accountname } = Route.useParams()

  return <WalletAssetRouteScreen accountname={accountname} assetId="hbd" />
}
