import { Aioha, KeyTypes, Providers, initAioha } from '@aioha/aioha'
import { normalizeWalletProvider, normalizeWalletUsername } from './walletAuth'
import type { Operation } from '@hiveio/dhive'
import type { ConnectedWalletAccount, WalletProvider } from './walletAuth'

const ACCOUNT_STORAGE_KEY = 'hivepen.account'
const PROVIDER_STORAGE_KEY = 'hivepen.walletProvider'
const LOGIN_MESSAGE = 'Login to Hivepen Studio'

let browserAioha: Aioha | null = null

type AiohaAccountDirectory = {
  getCurrentProvider: () => unknown
  getCurrentUser: () => string | null | undefined
  getLoginExpiration: (username: string) => number | undefined
  getOtherLogins: () => Record<string, unknown>
  logout: () => Promise<unknown>
  logoutAll: () => Promise<unknown>
  removeOtherLogin: (username: string) => unknown
  switchUser: (username: string) => boolean
}

type AiohaWalletStateSource = AiohaAccountDirectory & {
  isLoggedIn: () => boolean
  isProviderEnabled: (provider: Providers) => boolean
}

export type AiohaWalletState = {
  account: string | null
  activeAccount: string | null
  activeProvider: WalletProvider | null
  connectedAccounts: Array<ConnectedWalletAccount>
  isHiveAuthAvailable: boolean
  isKeychainAvailable: boolean
  isLoggedIn: boolean
  provider: WalletProvider | null
}

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

export function getConnectedAiohaAccounts(
  aioha: AiohaAccountDirectory = getAiohaInstance() as AiohaAccountDirectory,
) {
  const connectedAccounts: Array<ConnectedWalletAccount> = []
  const activeAccount = aioha.getCurrentUser()
  const activeProvider = normalizeWalletProvider(aioha.getCurrentProvider())

  if (activeAccount && activeProvider) {
    connectedAccounts.push({
      account: activeAccount,
      expiresAt: aioha.getLoginExpiration(activeAccount),
      isActive: true,
      provider: activeProvider,
    })
  }

  const otherLogins = aioha.getOtherLogins()

  Object.entries(otherLogins)
    .map(([account, provider]) => ({
      account,
      expiresAt: aioha.getLoginExpiration(account),
      isActive: false,
      provider: normalizeWalletProvider(provider),
    }))
    .filter(
      (
        entry,
      ): entry is {
        account: string
        expiresAt: number | undefined
        isActive: false
        provider: WalletProvider
      } =>
        Boolean(entry.provider) &&
        normalizeWalletUsername(entry.account) !==
          normalizeWalletUsername(activeAccount ?? ''),
    )
    .sort((left, right) => left.account.localeCompare(right.account))
    .forEach((entry) => {
      connectedAccounts.push(entry)
    })

  return connectedAccounts
}

export function syncLegacyWalletStorage(
  aioha: AiohaAccountDirectory = getAiohaInstance() as AiohaAccountDirectory,
) {
  if (typeof window === 'undefined') return

  const currentUser = aioha.getCurrentUser()
  const currentProvider = normalizeWalletProvider(aioha.getCurrentProvider())

  if (currentUser) {
    window.localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(currentUser),
    )
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

export function getAiohaWalletState(
  aioha: AiohaWalletStateSource = getAiohaInstance() as AiohaWalletStateSource,
) {
  const connectedAccounts = getConnectedAiohaAccounts(aioha)
  const activeAccount =
    connectedAccounts.find((entry) => entry.isActive)?.account ?? null
  const activeProvider =
    connectedAccounts.find((entry) => entry.isActive)?.provider ?? null

  return {
    account: activeAccount,
    activeAccount,
    activeProvider,
    connectedAccounts,
    isHiveAuthAvailable: aioha.isProviderEnabled(Providers.HiveAuth),
    isKeychainAvailable: aioha.isProviderEnabled(Providers.Keychain),
    isLoggedIn: aioha.isLoggedIn(),
    provider: activeProvider,
  }
}

export function isAiohaAccountConnected(
  username: string,
  aioha: AiohaAccountDirectory = getAiohaInstance() as AiohaAccountDirectory,
) {
  const normalized = normalizeWalletUsername(username)
  return getConnectedAiohaAccounts(aioha).some(
    (entry) => normalizeWalletUsername(entry.account) === normalized,
  )
}

export async function loginWithAioha(
  provider: Providers.Keychain | Providers.HiveAuth,
  username: string,
) {
  const aioha = getAiohaInstance()
  const result = await aioha.login(provider, username, getLoginOptions())
  syncLegacyWalletStorage(aioha as AiohaAccountDirectory)
  return result
}

export async function logoutAioha() {
  const aioha = getAiohaInstance()
  await aioha.logout()
  syncLegacyWalletStorage(aioha as AiohaAccountDirectory)
}

export async function logoutAllAioha() {
  const aioha = getAiohaInstance()
  await aioha.logoutAll()
  syncLegacyWalletStorage(aioha as AiohaAccountDirectory)
}

export function switchAiohaAccount(
  username: string,
  aioha: AiohaAccountDirectory = getAiohaInstance() as AiohaAccountDirectory,
) {
  const success = aioha.switchUser(username)
  syncLegacyWalletStorage(aioha)
  return success
}

export async function disconnectAiohaAccount(
  username: string,
  aioha: AiohaAccountDirectory = getAiohaInstance() as AiohaAccountDirectory,
) {
  const connectedAccounts = getConnectedAiohaAccounts(aioha)
  const normalized = normalizeWalletUsername(username)
  const target = connectedAccounts.find(
    (entry) => normalizeWalletUsername(entry.account) === normalized,
  )

  if (!target) {
    return {
      error: 'This Hive account is not connected.',
      success: false,
    } as const
  }

  if (!target.isActive) {
    aioha.removeOtherLogin(target.account)
    syncLegacyWalletStorage(aioha)
    return { success: true } as const
  }

  const nextActive = connectedAccounts.find((entry) => !entry.isActive)?.account

  await aioha.logout()

  if (!nextActive) {
    syncLegacyWalletStorage(aioha)
    return { success: true } as const
  }

  const switched = aioha.switchUser(nextActive)
  syncLegacyWalletStorage(aioha)

  if (!switched) {
    return {
      error: 'Unable to activate another connected account.',
      success: false,
    } as const
  }

  return { success: true } as const
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
  syncLegacyWalletStorage(aioha as AiohaAccountDirectory)
  return result
}
