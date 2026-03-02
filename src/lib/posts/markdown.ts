import { DefaultRenderer } from '@hiveio/content-renderer'
import { env } from '@/env'

const IMAGE_PROXY_PREFIX = 'https://images.hive.blog/0x0/'
const FALLBACK_BASE_URL = 'https://hive.blog/'

const ensureTrailingSlash = (url: string) =>
  url.endsWith('/') ? url : `${url}/`

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const normalizeBaseUrl = (value: string) => {
  try {
    const parsed = new URL(value)
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      return FALLBACK_BASE_URL
    }
    return ensureTrailingSlash(parsed.origin)
  } catch {
    return FALLBACK_BASE_URL
  }
}

const resolveBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeBaseUrl(window.location.origin)
  }

  if (env.SERVER_URL) {
    return normalizeBaseUrl(env.SERVER_URL)
  }

  return FALLBACK_BASE_URL
}

const isLinkSafe = (url: string) => {
  try {
    const parsed = new URL(url, 'https://example.com')
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

const proxyImage = (url: string) => {
  if (!url) return url
  if (url.startsWith(IMAGE_PROXY_PREFIX)) return url
  if (url.startsWith('https://images.hive.blog')) return url
  if (url.startsWith('data:')) return url
  if (url.startsWith('ipfs://')) return url
  return `${IMAGE_PROXY_PREFIX}${url}`
}

let renderer: DefaultRenderer | null = null
let rendererBaseUrl: string | null = null

const getRenderer = () => {
  const baseUrl = resolveBaseUrl()
  if (!renderer || rendererBaseUrl !== baseUrl) {
    renderer = new DefaultRenderer({
      baseUrl,
      breaks: true,
      skipSanitization: false,
      allowInsecureScriptTags: false,
      addNofollowToLinks: true,
      addTargetBlankToLinks: true,
      doNotShowImages: false,
      assetsWidth: 640,
      assetsHeight: 480,
      imageProxyFn: proxyImage,
      hashtagUrlFn: (hashtag) => `/search?tag=${hashtag}`,
      usertagUrlFn: (account) => `/profile/${account}`,
      isLinkSafeFn: isLinkSafe,
      addExternalCssClassToMatchingLinksFn: () => false,
      ipfsPrefix: 'https://ipfs.io/ipfs/',
    })
    rendererBaseUrl = baseUrl
  }

  return renderer
}

export const renderHiveMarkdown = (content: string) => {
  if (!content) return ''
  return getRenderer().render(content)
}
