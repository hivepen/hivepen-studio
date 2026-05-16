import { createFileRoute } from '@tanstack/react-router'

import { AccountAnalyticsPage } from '@/routes/dashboard'

export const Route = createFileRoute('/$accountname/analytics')({
  component: AccountAnalyticsRoute,
})

function AccountAnalyticsRoute() {
  const { accountname } = Route.useParams()

  return <AccountAnalyticsPage accountname={accountname} />
}
