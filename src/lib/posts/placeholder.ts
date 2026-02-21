const GRADIENTS = [
  'linear(to-bl, blue.200, transparent)',
  'linear(to-bl, teal.200, transparent)',
  'linear(to-bl, green.200, transparent)',
  'linear(to-bl, orange.200, transparent)',
  'linear(to-bl, pink.200, transparent)',
  'linear(to-bl, purple.200, transparent)',
]

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getPlaceholderGradient = (seed: string) => {
  const hash = hashString(seed)
  return GRADIENTS[hash % GRADIENTS.length]
}

export const getInitials = (value: string) => {
  const trimmed = value.trim().replace(/^@/, '')
  if (!trimmed) return ''
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
