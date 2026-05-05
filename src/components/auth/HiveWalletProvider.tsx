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
  PendingHiveAuthRequest,
  WalletLoginResult,
  WalletProvider,
  WalletRequestResult,
} from '@/lib/hive/walletAuth'
import { buildPendingHiveAuthRequest } from '@/lib/hive/walletAuth'
import {
  getAiohaInstance,
  getAiohaWalletState,
  loginWithAioha,
  logoutAioha,
  signAndBroadcastOperationsWithAioha,
  syncLegacyWalletStorage,
} from '@/lib/hive/aioha'

type WalletContextValue = {
  account: string | null
  clearPendingHiveAuthRequest: () => void
  connectWithHiveAuth: (username: string) => Promise<WalletLoginResult>
  connectWithKeychain: (username: string) => Promise<WalletLoginResult>
  disconnect: () => Promise<void>
  isHiveAuthAvailable: boolean
  isHiveAuthLoading: boolean
  isKeychainAvailable: boolean
  pendingHiveAuthRequest: PendingHiveAuthRequest | null
  provider: WalletProvider | null
  signAndBroadcastOperations: (
    operations: Array<Operation>,
    keyType?: 'Posting' | 'Active',
  ) => Promise<WalletRequestResult>
}

type WalletState = {
  account: string | null
  isHiveAuthAvailable: boolean
  isKeychainAvailable: boolean
  provider: WalletProvider | null
}

type HiveAuthEvent = {
  expire: number
  uuid: string
}

const HiveWalletContext = createContext<WalletContextValue | null>(null)

function getInitialWalletState(): WalletState {
  if (typeof window === 'undefined') {
    return {
      account: null,
      isHiveAuthAvailable: false,
      isKeychainAvailable: false,
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
    await logoutAioha()
    setWalletState(getAiohaWalletState(aioha))
  }

  const signAndBroadcastOperations = async (
    operations: Array<Operation>,
    keyType: 'Posting' | 'Active' = 'Posting',
  ) => {
    try {
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
        clearPendingHiveAuthRequest,
        connectWithHiveAuth,
        connectWithKeychain,
        disconnect,
        isHiveAuthAvailable: walletState.isHiveAuthAvailable,
        isHiveAuthLoading,
        isKeychainAvailable: walletState.isKeychainAvailable,
        pendingHiveAuthRequest,
        provider: walletState.provider,
        signAndBroadcastOperations,
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
