import { Icon, IconProps, Image } from "@chakra-ui/react"

export const HIVE_KEYCHAIN_ICON_URL = 'https://hive-keychain.com/favicon.png'

type HiveKeychainIconProps = Omit<IconProps, 'children'> & {
  size?: IconProps['size']
}

export default function HiveKeychainIcon({ size = 'md', ...props }: HiveKeychainIconProps) {
  return (
    <Icon size={size} {...props}>
      <Image src={HIVE_KEYCHAIN_ICON_URL} alt="Hive Keychain" />
    </Icon>
  )
}