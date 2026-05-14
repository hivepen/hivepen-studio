import { Avatar } from './ui/avatar'
import type { AvatarProps } from './ui/avatar'
import { hiveAvatarUrl } from '@/lib/posts/tagColorConfig'

interface AccountAvatarProps extends AvatarProps {
  username: string | null
}

function AccountAvatar({ username, ...props }: AccountAvatarProps) {
  const src: AvatarProps['src'] = username ? hiveAvatarUrl(username) : undefined

  return <Avatar src={src} name={username ?? undefined} {...props} />
}

export default AccountAvatar
