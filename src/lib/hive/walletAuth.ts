export type WalletProvider = 'keychain' | 'hiveauth' | 'hivesigner'

export type WalletLoginResult =
  | {
      success: true
    }
  | {
      success: false
      error?: string
    }

export type WalletRequestResult =
  | {
      success: true
      result?: string
    }
  | {
      success: false
      error?: string
    }

export type PendingHiveAuthRequest = {
  androidIntentLinks: {
    hiveAuth: string
    keychain: string
  }
  deeplink: string
  expireAt: number
  kind: 'login' | 'sign'
  qrCodeDataUrl?: string
  requestId: string
}

export const HIVE_AUTH_ANDROID_PACKAGES = {
  hiveauth: 'com.hiveauth.mobile',
  keychain: 'com.mobilekeychain',
} as const

export const HIVE_AUTH_ANDROID_STORE_URLS = {
  hiveauth: 'https://play.google.com/store/apps/details?id=com.hiveauth.mobile',
  keychain: 'https://play.google.com/store/apps/details?id=com.mobilekeychain',
} as const

export function normalizeWalletProvider(
  value: unknown,
): WalletProvider | undefined {
  return value === 'keychain' || value === 'hiveauth' || value === 'hivesigner'
    ? value
    : undefined
}

export function formatWalletProviderName(provider: WalletProvider | string) {
  if (provider === 'keychain') return 'Hive Keychain'
  if (provider === 'hiveauth') return 'HiveAuth'
  if (provider === 'hivesigner') return 'HiveSigner'

  return provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function buildAndroidIntentUrl(
  deeplink: string,
  packageName: string,
  fallbackUrl: string,
) {
  const intentPath = deeplink.replace(/^has:\/\//, '')
  return `intent://${intentPath}#Intent;scheme=has;package=${packageName};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`
}

export async function buildPendingHiveAuthRequest({
  deeplink,
  expireAt,
  kind,
  requestId,
}: {
  deeplink: string
  expireAt: number
  kind: PendingHiveAuthRequest['kind']
  requestId: string
}): Promise<PendingHiveAuthRequest> {
  let qrCodeDataUrl: string | undefined

  try {
    const { default: QRCode } = await import('qrcode')
    qrCodeDataUrl = await QRCode.toDataURL(deeplink, {
      margin: 1,
      width: 220,
    })
  } catch {
    // Keep the deep-link flow available if QR generation fails.
  }

  return {
    androidIntentLinks: {
      hiveAuth: buildAndroidIntentUrl(
        deeplink,
        HIVE_AUTH_ANDROID_PACKAGES.hiveauth,
        HIVE_AUTH_ANDROID_STORE_URLS.hiveauth,
      ),
      keychain: buildAndroidIntentUrl(
        deeplink,
        HIVE_AUTH_ANDROID_PACKAGES.keychain,
        HIVE_AUTH_ANDROID_STORE_URLS.keychain,
      ),
    },
    deeplink,
    expireAt,
    kind,
    qrCodeDataUrl,
    requestId,
  }
}
