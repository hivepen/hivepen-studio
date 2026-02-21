type HiveSignerAuth = {
  accessToken: string
  username: string
  expiresAt?: number
}

const STORAGE_KEY = 'hivesigner.auth'

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const parseAuthFromSearch = (search: string) => {
  const params = new URLSearchParams(search)
  const accessToken = params.get('access_token')
  const username = params.get('username')
  const expiresIn = params.get('expires_in')
  if (!accessToken || !username) return null

  const expiresAt = expiresIn ? Date.now() + Number(expiresIn) * 1000 : undefined
  return { accessToken, username, expiresAt }
}

export const persistHiveSignerAuthFromUrl = () => {
  if (typeof window === 'undefined') return null
  const auth =
    parseAuthFromSearch(window.location.search) ??
    parseAuthFromSearch(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '')
  if (!auth) return null

  const storage = getStorage()
  storage?.setItem(STORAGE_KEY, JSON.stringify(auth))

  if (window.history.replaceState) {
    const cleanUrl = `${window.location.pathname}${window.location.search
      .replace(/access_token=[^&]+&?/g, '')
      .replace(/username=[^&]+&?/g, '')
      .replace(/expires_in=[^&]+&?/g, '')
      .replace(/[?&]$/, '')}`
    window.history.replaceState({}, document.title, cleanUrl)
  }

  return auth
}

export const getHiveSignerAuth = (): HiveSignerAuth | null => {
  const storage = getStorage()
  if (!storage) return null

  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as HiveSignerAuth
    if (!parsed.accessToken || !parsed.username) return null
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

export const clearHiveSignerAuth = () => {
  const storage = getStorage()
  storage?.removeItem(STORAGE_KEY)
}

export const getHiveSignerLoginUrl = (scope: string[] = ['comment']) => {
  const app = import.meta.env.VITE_HIVESIGNER_APP
  const redirect = import.meta.env.VITE_HIVESIGNER_REDIRECT

  if (!app || !redirect) return null

  const params = new URLSearchParams({
    client_id: app,
    redirect_uri: redirect,
    scope: scope.join(','),
  })

  return `https://hivesigner.com/oauth2/authorize?${params.toString()}`
}
