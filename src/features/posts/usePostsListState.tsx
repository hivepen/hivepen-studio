import { useState } from 'react'

export type PostsScope = 'all' | 'user'

export default function usePostsListState() {
  const [scope, setScope] = useState<PostsScope>('all')
  const [username, setUsername] = useState('')

  return {
    scope,
    setScope,
    username,
    setUsername,
  }
}
