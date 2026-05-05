import { Aioha, KeyTypes, Providers, initAioha } from '@aioha/aioha'
import { normalizeWalletProvider } from './walletAuth'
import type { Operation } from '@hiveio/dhive'

const ACCOUNT_STORAGE_KEY = 'hivepen.account'
const PROVIDER_STORAGE_KEY = 'hivepen.walletProvider'
const LOGIN_MESSAGE = 'Login to Hivepen Studio'

let browserAioha: Aioha | null = null

function buildHiveAuthAppMeta() {
  return {
    name: 'Hivepen Studio',
    description: 'Hive writing and publishing workspace',
    icon:
      typeof window !== 'undefined'
        ? `${window.location.origin}/favicon.ico`
        : undefined,
  }
}

function getLoginOptions() {
  return {
    keyType: KeyTypes.Posting,
    loginTitle: LOGIN_MESSAGE,
    msg: LOGIN_MESSAGE,
  }
}

export function getAiohaInstance() {
  if (typeof window === 'undefined') {
    return new Aioha()
  }

  if (!browserAioha) {
    browserAioha = initAioha({
      hiveauth: buildHiveAuthAppMeta(),
    })
  }

  return browserAioha
}

export function syncLegacyWalletStorage(aioha = getAiohaInstance()) {
  if (typeof window === 'undefined') return

  const currentUser = aioha.getCurrentUser()
  const currentProvider = normalizeWalletProvider(aioha.getCurrentProvider())

  if (currentUser) {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(currentUser))
  } else {
    window.localStorage.removeItem(ACCOUNT_STORAGE_KEY)
  }

  if (currentProvider) {
    window.localStorage.setItem(
      PROVIDER_STORAGE_KEY,
      JSON.stringify(currentProvider),
    )
  } else {
    window.localStorage.removeItem(PROVIDER_STORAGE_KEY)
  }
}

export function getAiohaWalletState(aioha = getAiohaInstance()) {
  return {
    account: aioha.getCurrentUser() ?? null,
    isHiveAuthAvailable: aioha.isProviderEnabled(Providers.HiveAuth),
    isKeychainAvailable: aioha.isProviderEnabled(Providers.Keychain),
    isLoggedIn: aioha.isLoggedIn(),
    provider: normalizeWalletProvider(aioha.getCurrentProvider()) ?? null,
  }
}

export async function loginWithAioha(
  provider: Providers.Keychain | Providers.HiveAuth,
  username: string,
) {
  const aioha = getAiohaInstance()
  const result = await aioha.login(provider, username, getLoginOptions())
  syncLegacyWalletStorage(aioha)
  return result
}

export async function logoutAioha() {
  const aioha = getAiohaInstance()
  await aioha.logout()
  syncLegacyWalletStorage(aioha)
}

export async function signAndBroadcastOperationsWithAioha(
  operations: Array<Operation>,
  keyType: 'Posting' | 'Active',
) {
  const aioha = getAiohaInstance()
  const result = await aioha.signAndBroadcastTx(
    operations,
    keyType === 'Active' ? KeyTypes.Active : KeyTypes.Posting,
  )
  syncLegacyWalletStorage(aioha)
  return result
}
