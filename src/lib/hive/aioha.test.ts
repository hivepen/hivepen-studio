import { describe, expect, it } from 'vitest'
import { disconnectAiohaAccount, getAiohaWalletState } from './aioha'

type ProviderName = 'hiveauth' | 'keychain'

function createMockAioha({
  activeAccount,
  activeProvider,
  otherLogins = {},
  expirations = {},
}: {
  activeAccount: string | null
  activeProvider: ProviderName | null
  expirations?: Record<string, number | undefined>
  otherLogins?: Record<string, ProviderName>
}) {
  let currentAccount = activeAccount
  let currentProvider = activeProvider
  const connected = new Map(Object.entries(otherLogins))

  return {
    getCurrentProvider: () => currentProvider,
    getCurrentUser: () => currentAccount,
    getLoginExpiration: (username: string) => expirations[username],
    getOtherLogins: () => Object.fromEntries(connected.entries()),
    isLoggedIn: () => Boolean(currentAccount && currentProvider),
    isProviderEnabled: () => true,
    logout: () => {
      currentAccount = null
      currentProvider = null
      return Promise.resolve()
    },
    logoutAll: () => {
      connected.clear()
      currentAccount = null
      currentProvider = null
      return Promise.resolve()
    },
    removeOtherLogin: (username: string) => {
      const provider = connected.get(username)
      if (!provider) throw new Error('Cannot remove non-existent login')
      connected.delete(username)
      return {
        provider,
      }
    },
    switchUser: (username: string) => {
      const provider = connected.get(username)
      if (!provider) return false
      connected.delete(username)
      currentAccount = username
      currentProvider = provider
      return true
    },
  }
}

describe('aioha wallet state helpers', () => {
  it('maps active and inactive connected accounts', () => {
    const aioha = createMockAioha({
      activeAccount: 'alice',
      activeProvider: 'keychain',
      expirations: {
        alice: 1000,
        bob: 2000,
      },
      otherLogins: {
        bob: 'hiveauth',
      },
    })

    expect(getAiohaWalletState(aioha)).toMatchObject({
      account: 'alice',
      activeAccount: 'alice',
      activeProvider: 'keychain',
      connectedAccounts: [
        {
          account: 'alice',
          expiresAt: 1000,
          isActive: true,
          provider: 'keychain',
        },
        {
          account: 'bob',
          expiresAt: 2000,
          isActive: false,
          provider: 'hiveauth',
        },
      ],
      provider: 'keychain',
    })
  })

  it('removes an inactive connected account without affecting the active one', async () => {
    const aioha = createMockAioha({
      activeAccount: 'alice',
      activeProvider: 'keychain',
      otherLogins: {
        bob: 'hiveauth',
      },
    })

    await expect(disconnectAiohaAccount('bob', aioha)).resolves.toEqual({
      success: true,
    })

    expect(getAiohaWalletState(aioha).connectedAccounts).toEqual([
      {
        account: 'alice',
        expiresAt: undefined,
        isActive: true,
        provider: 'keychain',
      },
    ])
  })

  it('promotes another connected account when disconnecting the active one', async () => {
    const aioha = createMockAioha({
      activeAccount: 'bob',
      activeProvider: 'hiveauth',
      otherLogins: {
        alice: 'keychain',
      },
    })

    await expect(disconnectAiohaAccount('bob', aioha)).resolves.toEqual({
      success: true,
    })

    expect(getAiohaWalletState(aioha)).toMatchObject({
      account: 'alice',
      activeAccount: 'alice',
      activeProvider: 'keychain',
      connectedAccounts: [
        {
          account: 'alice',
          isActive: true,
          provider: 'keychain',
        },
      ],
    })
  })
})
