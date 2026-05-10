import { createFileRoute } from '@tanstack/react-router'
import { WalletAssetRouteScreen } from '@/features/wallet/walletScreens'

export const Route = createFileRoute('/$accountname/wallet/hive')({
  component: WalletHivePage,
})

function WalletHivePage() {
  const { accountname } = Route.useParams()

  return <WalletAssetRouteScreen accountname={accountname} assetId="hive" />
}
