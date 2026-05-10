import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$accountname/wallet')({
  component: WalletLayout,
})

function WalletLayout() {
  return <Outlet />
}
