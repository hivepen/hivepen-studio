import { createFileRoute } from '@tanstack/react-router'

import ProfilePage from '@/features/profile/ProfilePage'

export const Route = createFileRoute('/$accountname/')({
  component: AccountProfileRoute,
})

function AccountProfileRoute() {
  const { accountname } = Route.useParams()

  return <ProfilePage accountname={accountname} />
}
