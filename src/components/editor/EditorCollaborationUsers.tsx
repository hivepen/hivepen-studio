import { Avatar, AvatarGroup } from '@/components/ui/avatar'

export default function EditorCollaborationUsers({
  users,
  fallback,
}: {
  users: Array<{ name: string }>,
  fallback?: React.ReactNode,
}) {
  if (users.length === 0) {
    if (fallback) return fallback
    return null
  }

  return (
    <AvatarGroup>
      {users.map((user) => (
        <Avatar key={user.name} size="xs" name={user.name} />
      ))}
    </AvatarGroup>
  )
}
