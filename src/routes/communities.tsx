import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/communities')({
  component: CommunitiesLayout,
})

function CommunitiesLayout() {
  return <Outlet />
}
