export type HiveKeychainResponse = {
  success: boolean
  message?: string
  error?: string
  result?: unknown
}

export type HiveKeychain = {
  requestSignBuffer: (
    username: string,
    message: string,
    keyType: 'Posting' | 'Active' | 'Memo',
    callback: (response: HiveKeychainResponse) => void,
    rpc?: string
  ) => void
  requestBroadcast: (
    username: string,
    operations: unknown[],
    keyType: 'Posting' | 'Active',
    callback: (response: HiveKeychainResponse) => void,
    rpc?: string
  ) => void
}

export const getHiveKeychain = () => {
  if (typeof window === 'undefined') return null
  return (window as Window & { hive_keychain?: HiveKeychain }).hive_keychain ?? null
}

export const signLogin = (username: string, message: string) => {
  return new Promise<HiveKeychainResponse>((resolve) => {
    const keychain = getHiveKeychain()
    if (!keychain) {
      resolve({ success: false, message: 'Hive Keychain not detected.' })
      return
    }
    keychain.requestSignBuffer(username, message, 'Posting', (response) => {
      resolve(response)
    })
  })
}

export const broadcastOperations = (
  username: string,
  operations: unknown[],
  keyType: 'Posting' | 'Active'
) => {
  return new Promise<HiveKeychainResponse>((resolve) => {
    const keychain = getHiveKeychain()
    if (!keychain) {
      resolve({ success: false, message: 'Hive Keychain not detected.' })
      return
    }
    keychain.requestBroadcast(username, operations, keyType, (response) => {
      resolve(response)
    })
  })
}
