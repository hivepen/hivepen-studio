export type HiveAvatarSize = 'small'

export const getHiveAvatarUrl = (
  account: string,
  size?: HiveAvatarSize,
) => {
  const normalized = account.trim().toLowerCase()
  return `https://images.hive.blog/u/${normalized}/avatar${
    size ? `/${size}` : ''
  }`
}
