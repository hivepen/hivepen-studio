import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Providers } from '@aioha/aioha'
import type { Operation } from '@hiveio/dhive'
import type {
  ConnectedWalletAccount,
  PendingHiveAuthRequest,
  WalletLoginResult,
  WalletProvider,
  WalletRequestResult,
} from '@/lib/hive/walletAuth'
import {
  buildPendingHiveAuthRequest,
  normalizeWalletUsername,
} from '@/lib/hive/walletAuth'
import {
  disconnectAiohaAccount,
  getAiohaInstance,
  getAiohaWalletState,
  isAiohaAccountConnected,
  loginWithAioha,
  logoutAllAioha,
  signAndBroadcastOperationsWithAioha,
  switchAiohaAccount,
  syncLegacyWalletStorage,
} from '@/lib/hive/aioha'
import { broadcastOperations } from '@/lib/hive/keychain'

type WalletContextValue = {
  account: string | null
  activeAccount: string | null
  activeProvider: WalletProvider | null
  clearPendingHiveAuthRequest: () => void
  connectedAccounts: Array<ConnectedWalletAccount>
  connectWithHiveAuth: (username: string) => Promise<WalletLoginResult>
  connectWithKeychain: (username: string) => Promise<WalletLoginResult>
  disconnect: () => Promise<void>
  disconnectAccount: (username: string) => Promise<WalletLoginResult>
  disconnectAll: () => Promise<void>
  isHiveAuthAvailable: boolean
  isHiveAuthLoading: boolean
  isKeychainAvailable: boolean
  pendingHiveAuthRequest: PendingHiveAuthRequest | null
  provider: WalletProvider | null
  signAndBroadcastOperations: (
    operations: Array<Operation>,
    keyType?: 'Posting' | 'Active',
  ) => Promise<WalletRequestResult>
  switchAccount: (username: string) => Promise<WalletLoginResult>
}

type WalletState = ReturnType<typeof getAiohaWalletState>

type HiveAuthEvent = {
  expire: number
  uuid: string
}

const HiveWalletContext = createContext<WalletContextValue | null>(null)

function getInitialWalletState(): WalletState {
  if (typeof window === 'undefined') {
    return {
      account: null,
      activeAccount: null,
      activeProvider: null,
      connectedAccounts: [],
      isHiveAuthAvailable: false,
      isKeychainAvailable: false,
      isLoggedIn: false,
      provider: null,
    }
  }

  const aioha = getAiohaInstance()
  syncLegacyWalletStorage(aioha)
  return getAiohaWalletState(aioha)
}

function normalizeWalletError(error: string | undefined, fallback: string) {
  const trimmed = error?.trim()
  return trimmed || fallback
}

function duplicateAccountError(username: string) {
  return `@${normalizeWalletUsername(username)} is already connected.`
}

export function HiveWalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [aioha] = useState(() => getAiohaInstance())
  const [walletState, setWalletState] = useState<WalletState>(
    getInitialWalletState,
  )
  const [pendingHiveAuthRequest, setPendingHiveAuthRequest] =
    useState<PendingHiveAuthRequest | null>(null)
  const [isHiveAuthLoading, setIsHiveAuthLoading] = useState(false)

  useEffect(() => {
    let isDisposed = false

    const syncWalletState = () => {
      if (isDisposed) return

      startTransition(() => {
        syncLegacyWalletStorage(aioha)
        setWalletState(getAiohaWalletState(aioha))
      })
    }

    const handlePendingRequest = (kind: PendingHiveAuthRequest['kind']) => {
      return (deeplink: string, evt: HiveAuthEvent) => {
        void buildPendingHiveAuthRequest({
          deeplink,
          expireAt: evt.expire,
          kind,
          requestId: evt.uuid,
        }).then((request) => {
          if (isDisposed) return

          startTransition(() => {
            setPendingHiveAuthRequest(request)
          })
        })
      }
    }

    const handleLoginRequest = handlePendingRequest('login')
    const handleSignRequest = handlePendingRequest('sign')
    const clearPending = () => {
      if (isDisposed) return

      startTransition(() => {
        setPendingHiveAuthRequest(null)
      })
    }

    aioha.on('connect', syncWalletState)
    aioha.on('disconnect', syncWalletState)
    aioha.on('account_changed', syncWalletState)
    aioha.on('hiveauth_login_request', handleLoginRequest)
    aioha.on('hiveauth_sign_request', handleSignRequest)
    aioha.on('disconnect', clearPending)

    syncWalletState()

    return () => {
      isDisposed = true
      aioha.off('connect', syncWalletState)
      aioha.off('disconnect', syncWalletState)
      aioha.off('account_changed', syncWalletState)
      aioha.off('hiveauth_login_request', handleLoginRequest)
      aioha.off('hiveauth_sign_request', handleSignRequest)
      aioha.off('disconnect', clearPending)
    }
  }, [aioha])

  const clearPendingHiveAuthRequest = () => {
    startTransition(() => {
      setPendingHiveAuthRequest(null)
    })
  }

  const connectWithKeychain = async (username: string) => {
    if (isAiohaAccountConnected(username, aioha)) {
      return {
        success: false,
        error: duplicateAccountError(username),
      } satisfies WalletLoginResult
    }

    const result = await loginWithAioha(Providers.Keychain, username)

    if (result.success) {
      clearPendingHiveAuthRequest()
      setWalletState(getAiohaWalletState(aioha))
      return { success: true } satisfies WalletLoginResult
    }

    return {
      success: false,
      error: normalizeWalletError(
        result.error,
        'Login rejected by Hive Keychain.',
      ),
    } satisfies WalletLoginResult
  }

  const connectWithHiveAuth = async (username: string) => {
    if (isAiohaAccountConnected(username, aioha)) {
      return {
        success: false,
        error: duplicateAccountError(username),
      } satisfies WalletLoginResult
    }

    setIsHiveAuthLoading(true)
    clearPendingHiveAuthRequest()

    try {
      const result = await loginWithAioha(Providers.HiveAuth, username)

      if (result.success) {
        clearPendingHiveAuthRequest()
        setWalletState(getAiohaWalletState(aioha))
        return { success: true } satisfies WalletLoginResult
      }

      return {
        success: false,
        error: normalizeWalletError(
          result.error,
          'Login rejected by HiveAuth.',
        ),
      } satisfies WalletLoginResult
    } finally {
      setIsHiveAuthLoading(false)
    }
  }

  const disconnect = async () => {
    clearPendingHiveAuthRequest()
    await logoutAllAioha()
    setWalletState(getAiohaWalletState(aioha))
  }

  const disconnectAll = async () => {
    clearPendingHiveAuthRequest()
    await logoutAllAioha()
    setWalletState(getAiohaWalletState(aioha))
  }

  const switchAccount = (username: string) => {
    const switched = switchAiohaAccount(username)

    if (!switched) {
      return Promise.resolve({
        success: false,
        error: `Unable to switch to @${normalizeWalletUsername(username)}.`,
      } satisfies WalletLoginResult)
    }

    clearPendingHiveAuthRequest()
    setWalletState(getAiohaWalletState(aioha))
    return Promise.resolve({ success: true } satisfies WalletLoginResult)
  }

  const disconnectAccount = async (username: string) => {
    clearPendingHiveAuthRequest()
    const result = await disconnectAiohaAccount(username)
    setWalletState(getAiohaWalletState(aioha))

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      } satisfies WalletLoginResult
    }

    return { success: true } satisfies WalletLoginResult
  }

  const signAndBroadcastOperations = async (
    operations: Array<Operation>,
    keyType: 'Posting' | 'Active' = 'Posting',
  ) => {
    try {
      if (
        walletState.activeProvider === 'keychain' &&
        walletState.activeAccount
      ) {
        const result = await broadcastOperations(
          walletState.activeAccount,
          operations,
          keyType,
        )

        if (result.success) {
          return {
            success: true,
            result:
              typeof result.result === 'string' ? result.result : undefined,
          } satisfies WalletRequestResult
        }

        return {
          success: false,
          error: normalizeWalletError(
            result.error ?? result.message,
            'Broadcast rejected by Hive Keychain.',
          ),
        } satisfies WalletRequestResult
      }

      const result = await signAndBroadcastOperationsWithAioha(
        operations,
        keyType,
      )

      if (result.success) {
        return {
          success: true,
          result: typeof result.result === 'string' ? result.result : undefined,
        } satisfies WalletRequestResult
      }

      return {
        success: false,
        error: result.error,
      } satisfies WalletRequestResult
    } finally {
      clearPendingHiveAuthRequest()
      setWalletState(getAiohaWalletState(aioha))
    }
  }

  return (
    <HiveWalletContext.Provider
      value={{
        account: walletState.account,
        activeAccount: walletState.activeAccount,
        activeProvider: walletState.activeProvider,
        clearPendingHiveAuthRequest,
        connectedAccounts: walletState.connectedAccounts,
        connectWithHiveAuth,
        connectWithKeychain,
        disconnect,
        disconnectAccount,
        disconnectAll,
        isHiveAuthAvailable: walletState.isHiveAuthAvailable,
        isHiveAuthLoading,
        isKeychainAvailable: walletState.isKeychainAvailable,
        pendingHiveAuthRequest,
        provider: walletState.provider,
        signAndBroadcastOperations,
        switchAccount,
      }}
    >
      {children}
    </HiveWalletContext.Provider>
  )
}

export function useHiveWallet() {
  const context = useContext(HiveWalletContext)

  if (!context) {
    throw new Error('useHiveWallet must be used within HiveWalletProvider')
  }

  return context
}
