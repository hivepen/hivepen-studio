import type { HiveKeychain } from '@/lib/hive/keychain'

declare global {
  interface Window {
    hive_keychain?: HiveKeychain
  }
}

export {}
