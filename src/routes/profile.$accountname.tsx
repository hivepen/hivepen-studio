import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/$accountname')({
  beforeLoad: ({ params }) => {
    const username = params.accountname.replace(/^@/, '')

    throw redirect({
      params: { accountname: `@${username}` },
      to: '/$accountname',
    })
  },
})
